###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:20-alpine AS development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install app dependencies using pnpm
RUN pnpm install

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# In order to run `pnpm run build` we need access to the Nest CLI.
# The Nest CLI is a dev dependency,
# In the previous development stage we ran `pnpm install` which installed all dependencies.
# So we can copy over the node_modules directory from the development image into this build image.
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN pnpm run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Running `pnpm install --prod` removes the existing node_modules directory.
# Passing in --prod ensures that only the production dependencies are installed.
# This ensures that the node_modules directory is as optimized as possible.
RUN pnpm install --prod && pnpm store prune

USER node

###################
# PRODUCTION
###################

FROM node:20-alpine AS production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
