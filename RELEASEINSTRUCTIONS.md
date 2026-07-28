# PoE-Overlay Release Instructions

## Pre-requisited
* Have the correct rights in Github to create a new release and push to `master`
* Have the correct rights in SignPath to approve new signing requests
* Have OpenSSL installed
* (Optional) Have the correct rights in AppVeyor to access/monitor the release build

## Creating a release
* Make sure you've met all pre-requisited, if not, do NOT continue creating a release!
* Make sure none of the PRs have bumped the version within their PR.
  * If this did happen, make an additional commit to put the version back to its current release version.
* Start creating a commit to bump the version:
  * Bump the version in both the `package.json` and `package-lock.json`
  * Add any missing changes to the `CHANGELOG.md`
* Commit the version bump using the correct wording: `Bumped version to v[X.Y.Z]` where you replace the `[X.Y.Z]` with the new version that matches the `package.json` (e.g. `Bumped version to v0.8.19`)
  * When you've had to update the `CHANGELOG.md`, append the commit message with: `; Updated the ChangeLog` so it'll look like this: `Bumped version to v[X.Y.Z]; Updated the ChangeLog` (where you replace the `[X.Y.Z]` with the new version)
* Push this new version bump commit directly to the `master` branch
* Wait for AppVeyor to complete the build and for SignPath to create the signing request (this should take around 15~20 minutes)
* Once the signing request is ready (you should get an e-mail about this), visit SignPath and approve the signing request
* Wait for SignPath to finish the signing request (this should take around 1~2 minutes)
* Download the zip which contains the signed files
* Extract the zip into the `release` folder of the project's root
* Open up the folder, remove the `.blockmap` file
* Replace the spaces in both `.exe` files with `-` (hyphen)
* Run the `prep-release` script (no arguments should be required), this'll update the `latest.yml` with the new hashes of the signed `.exe` (instead of hash of the unsigned `.exe`)
* Start creating a release in Github:
  * Click the 'choose tag' button to create a new tag and name it: `v[X.Y.Z]` where you replace the `[X.Y.Z]` with the new version. (Note that the `v` at the start is mandatory!)
  * For the title of the release, match the tag and input the new version number (also including the `v` at the start)
  * Add a description: you can just copy-paste it from a previous release and replace the bullets with the changes found in the `CHANGELOG.md` and update the mentioned file names
  * Add the `latest.yml` and both `.exe` files to the release
  * Now press "Publish" to actually publish the release
