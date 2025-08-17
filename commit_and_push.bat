@echo off
echo Adding all changes to git...
git add .

echo Committing changes...
git commit -m "refactor: Remove external API dependency and enhance mock server

- Removed jsonplaceholder.typicode.com dependency
- Enhanced mock server with realistic error simulation
- Improved data fetching with retry logic
- Added comprehensive error handling for network operations"

echo Pushing to remote repository...
git push

echo Done!
