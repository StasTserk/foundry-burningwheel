## Contributing Guidelines

With the system going into a more passive bugfixing and maintenance mode with the release of 1.0, the pace of new features may slow drastically.
As such, this project is open to accepting pull requests contributions from enterprising developers.
That said, I plan on maintaining at least some coherence in the code style and quality of the codebase so new code.

## Getting Started

If you are interested in writing some cool new feature or quality of life improvement for the system, first step is to build the project.
 - Ensure Node.js and NPM are installed
 - Clone the project somehwere locally
 - Run `npm install` then `npm run build-dev` to build the project. `npm run watch` if you want changes live as you develop.
 - Have a look at the newly created `foundryConfig.json`. All build artifacts are deployed to the path indicated there.
 Do with that what you will (set up a symlink, change to the foundry systems folder, whatever floats your boat)
 - Once the generated files make their way over to `wherever your foundry exists/data/systems/burningwheel` test that the system starts correctly
 - If everything works fine, make yourself a feature branch (PRs directly into master will get rejected) and get to work.

## Things to do
 - [Write Good Commit Messages](https://chris.beams.io/posts/git-commit/).
 - Break up your work in commits. Avoid monolithic `Did all the things` commits with thousands of lines of code changed all at once.
 - Squash commit history that contains a lot of small "fixed a typo" type commits.
 - Ensure your branch is rebased onto the latest master before opening a PR
 
## Things to don't
 - Don't commit generated files. If the build process makes it automatically, it shouldn't be in the repository.
 - Don't Include more than one feature or fix in a PR.
 - Don't include changes unrelated to the purpose of the PR. Don't change version numbers, don't change the .gitignore, etc.
 - Don't add tabs. In this project, if you hit the tab key your IDE should insert 4 spaces.
 - Don't open another PR if changes are requested. Just push to the same branch.
 
