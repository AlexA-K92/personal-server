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

static int connect_to_server(void) {
    int sock_fd;
    struct sockaddr_in server_addr;

    sock_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd < 0) {
        perror("[CLIENT] socket");
        return -1;
    }

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(SERVER_PORT);

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

int main(void) {
    SSL_CTX *tls_ctx = create_client_tls_context();
    if (tls_ctx == NULL) {
        fprintf(stderr, "[CLIENT] Failed to create TLS context.\n");
        return 1;
    }

    int sock_fd = connect_to_server();
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