FROM talis/ubuntu:1404-latest

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y --force-yes \
        curl \
        git \
        apt-transport-https \
        nodejs=8.9.4-1nodesource1 \
        python \
        build-essential \
        envconsul \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get -y autoremove && apt-get clean && apt-get autoclean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /var/talis-node
COPY . /var/talis-node

WORKDIR /var/talis-node


