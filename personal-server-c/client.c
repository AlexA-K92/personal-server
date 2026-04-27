#include "common.h"
#include "tls.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <openssl/ssl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>


static int parse_port_or_default(int argc, char *argv[]) {
    int port = SERVER_PORT;

    if (argc >= 2) {
        int parsed = atoi(argv[1]);

        if (parsed >= 1024 && parsed <= 65535) {
            port = parsed;
        } else {
            fprintf(stderr, "[CLIENT] Invalid port '%s'. Using default %d.\n", argv[1], SERVER_PORT);
        }
    }

    return port;
}


static int connect_to_server(int port) {
    int sock_fd;
    struct sockaddr_in server_addr;

    sock_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd < 0) {
        perror("[CLIENT] socket");
        return -1;
    }

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons((uint16_t)port);

    if (inet_pton(AF_INET, SERVER_HOST, &server_addr.sin_addr) <= 0) {
        perror("[CLIENT] inet_pton");
        close(sock_fd);
        return -1;
    }

    if (connect(sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("[CLIENT] connect");
        close(sock_fd);
        return -1;
    }

    return sock_fd;
}

int main(int argc, char *argv[]) {
    SSL_CTX *tls_ctx = create_client_tls_context();
    int port = parse_port_or_default(argc, argv);
    if (tls_ctx == NULL) {
        fprintf(stderr, "[CLIENT] Failed to create TLS context.\n");
        return 1;
    }

    int sock_fd = connect_to_server(port);
    if (sock_fd < 0) {
        free_tls_context(tls_ctx);
        return 1;
    }

    SSL *ssl = connect_tls_connection(tls_ctx, sock_fd, SERVER_HOSTNAME);
    if (ssl == NULL) {
        close(sock_fd);
        free_tls_context(tls_ctx);
        return 1;
    }

    const char *message = "Hello from PrivateVault TLS client.";
    if (SSL_write(ssl, message, strlen(message)) <= 0) {
        fprintf(stderr, "[CLIENT] Failed to write TLS message.\n");
        close_tls_connection(ssl);
        close(sock_fd);
        free_tls_context(tls_ctx);
        return 1;
    }

    char buffer[BUFFER_SIZE];
    memset(buffer, 0, sizeof(buffer));

    int bytes_read = SSL_read(ssl, buffer, sizeof(buffer) - 1);
    if (bytes_read <= 0) {
        fprintf(stderr, "[CLIENT] Failed to read TLS response.\n");
        close_tls_connection(ssl);
        close(sock_fd);
        free_tls_context(tls_ctx);
        return 1;
    }

    printf("[CLIENT] Server replied: %s\n", buffer);

    close_tls_connection(ssl);
    close(sock_fd);
    free_tls_context(tls_ctx);

    return 0;
}