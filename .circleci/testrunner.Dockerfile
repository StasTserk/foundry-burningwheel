ARG PLAYWRIGHT_VERSION=1.49.1

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-jammy AS base

# how docker is installed and configured in the circleci base images
# https://github.com/CircleCI-Public/cimg-base/blob/main/Dockerfile.template
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        openssh-client \
        ca-certificates \
        apt-transport-https \
        curl \
        gnupg-agent \
    software-properties-common && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    add-apt-repository -y "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $( lsb_release -cs ) stable" && \
    apt-get install -y \
        docker-ce=5:25.0.3-1~ubuntu.$( lsb_release -rs )~$( lsb_release -cs ) \
        docker-ce-cli=5:25.0.3-1~ubuntu.$( lsb_release -rs )~$( lsb_release -cs ) \
        containerd.io