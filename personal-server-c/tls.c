#include "tls.h"

#include <stdio.h>
#include <openssl/err.h>
#include <openssl/x509v3.h>

static void print_openssl_errors(const char *message) {
    fprintf(stderr, "%s\n", message);
    ERR_print_errors_fp(stderr);
}

SSL_CTX *create_server_tls_context(void) {
    SSL_CTX *ctx = SSL_CTX_new(TLS_server_method());
    if (ctx == NULL) {
        print_openssl_errors("[TLS SERVER] Failed to create SSL_CTX.");
        return NULL;
    }

    if (!SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION)) {
        print_openssl_errors("[TLS SERVER] Failed to set minimum TLS version.");
        SSL_CTX_free(ctx);
        return NULL;
    }

    if (SSL_CTX_use_certificate_file(ctx, TLS_CERT_FILE, SSL_FILETYPE_PEM) <= 0) {
        print_openssl_errors("[TLS SERVER] Failed to load server certificate.");
        SSL_CTX_free(ctx);
        return NULL;
    }

    if (SSL_CTX_use_PrivateKey_file(ctx, TLS_KEY_FILE, SSL_FILETYPE_PEM) <= 0) {
        print_openssl_errors("[TLS SERVER] Failed to load server private key.");
        SSL_CTX_free(ctx);
        return NULL;
    }

    if (!SSL_CTX_check_private_key(ctx)) {
        print_openssl_errors("[TLS SERVER] Private key does not match certificate.");
        SSL_CTX_free(ctx);
        return NULL;
    }

    return ctx;
}

SSL_CTX *create_client_tls_context(void) {
    SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());
    if (ctx == NULL) {
        print_openssl_errors("[TLS CLIENT] Failed to create SSL_CTX.");
        return NULL;
    }

    if (!SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION)) {
        print_openssl_errors("[TLS CLIENT] Failed to set minimum TLS version.");
        SSL_CTX_free(ctx);
        return NULL;
    }

    if (SSL_CTX_load_verify_locations(ctx, TLS_CA_FILE, NULL) != 1) {
        print_openssl_errors("[TLS CLIENT] Failed to load CA certificate.");
        SSL_CTX_free(ctx);
        return NULL;
    }

    SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);

    return ctx;
}

SSL *accept_tls_connection(SSL_CTX *ctx, int client_fd) {
    SSL *ssl = SSL_new(ctx);
    if (ssl == NULL) {
        print_openssl_errors("[TLS SERVER] SSL_new failed.");
        return NULL;
    }

    if (SSL_set_fd(ssl, client_fd) != 1) {
        print_openssl_errors("[TLS SERVER] SSL_set_fd failed.");
        SSL_free(ssl);
        return NULL;
    }

    if (SSL_accept(ssl) <= 0) {
        print_openssl_errors("[TLS SERVER] TLS handshake failed.");
        SSL_free(ssl);
        return NULL;
    }

    printf("[TLS SERVER] TLS connection established using cipher: %s\n", SSL_get_cipher(ssl));

    return ssl;
}

SSL *connect_tls_connection(SSL_CTX *ctx, int server_fd, const char *hostname) {
    SSL *ssl = SSL_new(ctx);
    if (ssl == NULL) {
        print_openssl_errors("[TLS CLIENT] SSL_new failed.");
        return NULL;
    }

    if (SSL_set_fd(ssl, server_fd) != 1) {
        print_openssl_errors("[TLS CLIENT] SSL_set_fd failed.");
        SSL_free(ssl);
        return NULL;
    }

    X509_VERIFY_PARAM *verify_param = SSL_get0_param(ssl);
    if (X509_VERIFY_PARAM_set1_host(verify_param, hostname, 0) != 1) {
        print_openssl_errors("[TLS CLIENT] Failed to set hostname verification.");
        SSL_free(ssl);
        return NULL;
    }

    if (SSL_connect(ssl) <= 0) {
        print_openssl_errors("[TLS CLIENT] TLS handshake failed.");
        SSL_free(ssl);
        return NULL;
    }

    long verify_result = SSL_get_verify_result(ssl);
    if (verify_result != X509_V_OK) {
        fprintf(stderr, "[TLS CLIENT] Certificate verification failed: %s\n",
                X509_verify_cert_error_string(verify_result));
        SSL_free(ssl);
        return NULL;
    }

    printf("[TLS CLIENT] TLS connection established using cipher: %s\n", SSL_get_cipher(ssl));

    return ssl;
}

void close_tls_connection(SSL *ssl) {
    if (ssl != NULL) {
        SSL_shutdown(ssl);
        SSL_free(ssl);
    }
}

void free_tls_context(SSL_CTX *ctx) {
    if (ctx != NULL) {
        SSL_CTX_free(ctx);
    }
}