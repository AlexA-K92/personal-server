#ifndef TLS_H
#define TLS_H

#include <openssl/ssl.h>

#define TLS_CERT_FILE "certs/server.crt"
#define TLS_KEY_FILE  "certs/server.key"
#define TLS_CA_FILE   "certs/ca.crt"

SSL_CTX *create_server_tls_context(void);
SSL_CTX *create_client_tls_context(void);

SSL *accept_tls_connection(SSL_CTX *ctx, int client_fd);
SSL *connect_tls_connection(SSL_CTX *ctx, int server_fd, const char *hostname);

void close_tls_connection(SSL *ssl);
void free_tls_context(SSL_CTX *ctx);

#endif