#!/bin/bash

git add .

echo 'Committing source changes'
# Commit changes.
msg="Updating site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"

echo 'Push source'
# Push source and build repos.
git push origin master


echo -e "\033[0;32mDeploying updates to GitHub...\033[0m"

echo 'Build hugo'

# Build the project.
hugo # if using a theme, replace with `hugo -t <YOURTHEME>`

# Go To Public folder
cd public
# Add changes to git.
echo 'Add changes to git'
git add .

# Commit changes.
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
echo 'Commit'
git commit -m "$msg"

# Push source and build repos.
echo 'Push'
git push origin master

# Come Back up to the Project Root
cd ..
