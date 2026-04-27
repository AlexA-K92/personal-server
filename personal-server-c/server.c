#include "common.h"
#include "tls.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <openssl/ssl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define USER_DB_FILE "user_db.txt"
#define MAX_LINE 1024
#define USERNAME_SIZE 64
#define ROLE_SIZE 16
#define SALT_HEX_SIZE 33
#define KEY_HEX_SIZE 65
#define NONCE_SIZE 16
#define KEY_SIZE 32
#define HMAC_SIZE 32

typedef struct {
    char username[USERNAME_SIZE];
    char role[ROLE_SIZE];
    char salt_hex[SALT_HEX_SIZE];
    unsigned char stored_key[KEY_SIZE];
} UserRecord;

static int create_server_socket(int port) {
    int server_fd;
    struct sockaddr_in server_addr;
    int opt = 1;

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("[SERVER] socket");
        return -1;
    }

    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("[SERVER] setsockopt");
        close(server_fd);
        return -1;
    }

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    server_addr.sin_port = htons((uint16_t)port);

    if (bind(server_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("[SERVER] bind");
        close(server_fd);
        return -1;
    }

    if (listen(server_fd, 5) < 0) {
        perror("[SERVER] listen");
        close(server_fd);
        return -1;
    }

    return server_fd;
}

static void strip_newline(char *s) {
    s[strcspn(s, "\r\n")] = '\0';
}

static int hex_value(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return 10 + c - 'a';
    if (c >= 'A' && c <= 'F') return 10 + c - 'A';
    return -1;
}

static int hex_to_bytes(const char *hex, unsigned char *out, size_t out_len) {
    size_t hex_len = strlen(hex);

    if (hex_len != out_len * 2) {
        return 0;
    }

    for (size_t i = 0; i < out_len; i++) {
        int high = hex_value(hex[i * 2]);
        int low = hex_value(hex[i * 2 + 1]);

        if (high < 0 || low < 0) {
            return 0;
        }

        out[i] = (unsigned char)((high << 4) | low);
    }

    return 1;
}

static void bytes_to_hex(const unsigned char *bytes, size_t len, char *out_hex) {
    static const char *hex_chars = "0123456789abcdef";

    for (size_t i = 0; i < len; i++) {
        out_hex[i * 2] = hex_chars[(bytes[i] >> 4) & 0x0F];
        out_hex[i * 2 + 1] = hex_chars[bytes[i] & 0x0F];
    }

    out_hex[len * 2] = '\0';
}

static int ssl_send_line(SSL *ssl, const char *line) {
    size_t len = strlen(line);
    int written = SSL_write(ssl, line, (int)len);
    return written == (int)len;
}

static int ssl_read_line(SSL *ssl, char *buffer, size_t buffer_size) {
    size_t index = 0;

    while (index + 1 < buffer_size) {
        char c;
        int n = SSL_read(ssl, &c, 1);

        if (n <= 0) {
            return -1;
        }

        buffer[index++] = c;

        if (c == '\n') {
            break;
        }
    }

    buffer[index] = '\0';
    strip_newline(buffer);

    return (int)index;
}

static int load_user(const char *username, UserRecord *out_user) {
    FILE *fp = fopen(USER_DB_FILE, "r");
    if (!fp) {
        perror("[SERVER] fopen user_db.txt");
        return 0;
    }

    char line[MAX_LINE];

    while (fgets(line, sizeof(line), fp)) {
        strip_newline(line);

        char file_username[USERNAME_SIZE];
        char file_role[ROLE_SIZE];
        char salt_hex[SALT_HEX_SIZE];
        char key_hex[KEY_HEX_SIZE];

        int fields = sscanf(
            line,
            "%63[^:]:%15[^:]:%32[^:]:%64s",
            file_username,
            file_role,
            salt_hex,
            key_hex
        );

        if (fields != 4) {
            continue;
        }

        if (strcmp(file_username, username) == 0) {
            memset(out_user, 0, sizeof(*out_user));

            strncpy(out_user->username, file_username, sizeof(out_user->username) - 1);
            strncpy(out_user->role, file_role, sizeof(out_user->role) - 1);
            strncpy(out_user->salt_hex, salt_hex, sizeof(out_user->salt_hex) - 1);

            if (!hex_to_bytes(key_hex, out_user->stored_key, KEY_SIZE)) {
                fclose(fp);
                return 0;
            }

            fclose(fp);
            return 1;
        }
    }

    fclose(fp);
    return 0;
}

static int verify_challenge_response(
    const UserRecord *user,
    const unsigned char *nonce,
    const char *client_response_hex
) {
    unsigned char client_response[HMAC_SIZE];

    if (!hex_to_bytes(client_response_hex, client_response, HMAC_SIZE)) {
        return 0;
    }

    unsigned char expected[EVP_MAX_MD_SIZE];
    unsigned int expected_len = 0;

    HMAC(
        EVP_sha256(),
        user->stored_key,
        KEY_SIZE,
        nonce,
        NONCE_SIZE,
        expected,
        &expected_len
    );

    if (expected_len != HMAC_SIZE) {
        return 0;
    }

    return CRYPTO_memcmp(expected, client_response, HMAC_SIZE) == 0;
}

static int authenticate_client(SSL *ssl, UserRecord *authenticated_user) {
    char line[MAX_LINE];

    if (ssl_read_line(ssl, line, sizeof(line)) <= 0) {
        return 0;
    }

    char username[USERNAME_SIZE];

    if (sscanf(line, "AUTH_BEGIN %63s", username) != 1) {
        ssl_send_line(ssl, "AUTH_FAIL expected_auth_begin\n");
        return 0;
    }

    UserRecord user;

    if (!load_user(username, &user)) {
        ssl_send_line(ssl, "AUTH_FAIL unknown_user\n");
        return 0;
    }

    unsigned char nonce[NONCE_SIZE];
    char nonce_hex[NONCE_SIZE * 2 + 1];

    if (RAND_bytes(nonce, sizeof(nonce)) != 1) {
        ssl_send_line(ssl, "AUTH_FAIL nonce_generation_failed\n");
        return 0;
    }

    bytes_to_hex(nonce, sizeof(nonce), nonce_hex);

    char challenge[MAX_LINE];
    snprintf(
        challenge,
        sizeof(challenge),
        "AUTH_CHALLENGE %s %s\n",
        user.salt_hex,
        nonce_hex
    );

    ssl_send_line(ssl, challenge);

    if (ssl_read_line(ssl, line, sizeof(line)) <= 0) {
        return 0;
    }

    char response_hex[HMAC_SIZE * 2 + 1];

    if (sscanf(line, "AUTH_RESPONSE %64s", response_hex) != 1) {
        ssl_send_line(ssl, "AUTH_FAIL expected_auth_response\n");
        return 0;
    }

    if (!verify_challenge_response(&user, nonce, response_hex)) {
        ssl_send_line(ssl, "AUTH_FAIL unknown user\n");
        return 0;
    }

    *authenticated_user = user;

    char ok[MAX_LINE];
    snprintf(ok, sizeof(ok), "AUTH_OK %s %s\n", user.username, user.role);
    ssl_send_line(ssl, ok);

    return 1;
}

static void run_command_loop(SSL *ssl, const UserRecord *user) {
    char line[MAX_LINE];

    while (1) {
        int n = ssl_read_line(ssl, line, sizeof(line));

        if (n <= 0) {
            printf("[SERVER] Client disconnected.\n");
            break;
        }

        if (strcmp(line, "WHOAMI") == 0) {
            char response[MAX_LINE];
            snprintf(
                response,
                sizeof(response),
                "USER %s ROLE %s\n",
                user->username,
                user->role
            );
            ssl_send_line(ssl, response);
        } else if (strcmp(line, "STATUS") == 0) {
            ssl_send_line(ssl, "STATUS TLS_ACTIVE AUTHENTICATED\n");
        } else if (strcmp(line, "HELP") == 0) {
            ssl_send_line(ssl, "COMMANDS WHOAMI STATUS HELP QUIT\n");
        } else if (strcmp(line, "QUIT") == 0) {
            ssl_send_line(ssl, "GOODBYE\n");
            break;
        } else {
            ssl_send_line(ssl, "ERROR unknown_command\n");
        }
    }
}

static int parse_port_or_default(int argc, char *argv[]) {
    int port = SERVER_PORT;

    if (argc >= 2) {
        int parsed = atoi(argv[1]);

        if (parsed >= 1024 && parsed <= 65535) {
            port = parsed;
        } else {
            fprintf(stderr, "[SERVER] Invalid port '%s'. Using default %d.\n", argv[1], SERVER_PORT);
        }
    }

    return port;
}

int main(int argc, char *argv[]) {
    SSL_CTX *tls_ctx = create_server_tls_context();
    int port = parse_port_or_default(argc, argv);
    if (tls_ctx == NULL) {
        fprintf(stderr, "[SERVER] Failed to create TLS context.\n");
        return 1;
    }

    int server_fd = create_server_socket(port);
    if (server_fd < 0) {
        free_tls_context(tls_ctx);
        return 1;
    }

        printf("[SERVER] PrivateVault TLS auth server listening on 127.0.0.1:%d\n", port);
    while (1) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);

        int client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &client_len);
        if (client_fd < 0) {
            perror("[SERVER] accept");
            continue;
        }

        printf("[SERVER] Client connected. Starting TLS handshake...\n");

        SSL *ssl = accept_tls_connection(tls_ctx, client_fd);
        if (ssl == NULL) {
            close(client_fd);
            continue;
        }

        UserRecord authenticated_user;

        if (authenticate_client(ssl, &authenticated_user)) {
            printf(
                "[SERVER] Authentication SUCCESS for user '%s' role '%s'\n",
                authenticated_user.username,
                authenticated_user.role
            );

            run_command_loop(ssl, &authenticated_user);
        } else {
            printf("[SERVER] Authentication failed.\n");
        }

        close_tls_connection(ssl);
        close(client_fd);
    }

    close(server_fd);
    free_tls_context(tls_ctx);

    return 0;
}