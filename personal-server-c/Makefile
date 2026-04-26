CC = gcc
CFLAGS = -std=gnu17 -Wall -Wextra -g $(shell pkg-config --cflags openssl)
LDLIBS = $(shell pkg-config --libs openssl)

all: server client

server: server.o tls.o
	$(CC) $(CFLAGS) -o server server.o tls.o $(LDLIBS)

client: client.o tls.o
	$(CC) $(CFLAGS) -o client client.o tls.o $(LDLIBS)

server.o: server.c common.h tls.h
	$(CC) $(CFLAGS) -c server.c

client.o: client.c common.h tls.h
	$(CC) $(CFLAGS) -c client.c

tls.o: tls.c tls.h
	$(CC) $(CFLAGS) -c tls.c

clean:
	rm -f *.o server client