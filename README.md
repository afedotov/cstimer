# csTimer

Professional Speedcubing/Training Timer

This branch contains patched version of csTimer that targeted to client-side only deployment.
It doesn't contain any server-side services and integrations and can be runned locally or deployed 
on any static file hosting like GitHub Pages.

# Updates

 - **2023.02.16** This version adds support for GAN Smart Timer using its Bluetooth protocol

# Building and running csTimer locally

Building csTimer from source code and running it locally may be useful for development or other purposes.
To accomplish this you should have Docker environment available on your development host.
The easest way is to use [Docker Desktop](https://www.docker.com/products/docker-desktop/)
No other is needed because all stuff you need to compile and run this project can be obtained as
publicity avaliable official Docker images for `Java JDK` and `PHP`.

Source distribution includes `./docker/` folder where you can find following scripts:

 - `./docker/build.sh` \
    Use it to build project. It invokes `make` inside `eclipse-temurin:8-jdk-centos7` container
    which have Java JDK required to run Closure complier.

    ```
    $ ./docker/build.sh clean
    $ ./docker/build.sh
    ```

- `./docker/serve.sh` \
    Use it to start local HTTP server serving compiled `dist` directory. It uses `php:apache` image
    that include Apache HTTP server with PHP support. Server also configured to HTTPS protocol.
    If you generated your own SSL certificate and key files, you can place them in
    `./docker/localhost-crt.pem` and `./docker/localhost-key.pem` files accordingly.
    If you don't have such certificates, self-signed certificates will be generated automatically.

    ```
    $ ./docker/serve.sh
    ```

    Localy running instance of csTimer can be accessed by these URLs:

     - HTTP URL: http://localhost:8080/
     - HTTPS URL: https://localhost:8443/

