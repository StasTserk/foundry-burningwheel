FROM node:20-alpine

# Set the foundry install home
RUN adduser -D foundry
RUN mkdir -p /home/foundry/fvtt
RUN mkdir -p /home/foundry/fvttdata/

ENV FOUNDRY_HOME=/home/foundry/fvtt
ENV FOUNDRY_DATA=/home/foundry/fvttdata

WORKDIR "${FOUNDRY_DATA}"
# system
COPY ./dist ./Data/systems/burningwheel
# seeded data
COPY ./test-world ./Data/worlds/test-world
# secrets needed to avoid asking for license
COPY ./license.json ./Config/
COPY ./options.json ./Config/

# Set the current working directory
WORKDIR "${FOUNDRY_HOME}"

# copy and extract foundry zipfile
COPY ./FoundryVTT-12.331.zip .
RUN unzip FoundryVTT*.zip

EXPOSE 30000
CMD node ${FOUNDRY_HOME}/resources/app/main.js --dataPath=${FOUNDRY_DATA}