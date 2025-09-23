// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
# Set the repository URLs
export OLD_REPO="https://github.com/sinyorlang-design/TradeLine24-7Ai.git"
export NEW_REPO="https://github.com/sinyorlang-design/tradeline-quest.git"

# Clone the new empty repo
git clone "$NEW_REPO" tradeline-migration
cd tradeline-migration

# Add your old repo as a remote
git remote add old "$OLD_REPO"

# Fetch all branches from old repo
git fetch old --prune

# Check out the main/master branch from old repo
git checkout -B main old/main || git checkout -B main old/master

# Push everything to the new repo
git push -f origin main

# Verify the transfer
git ls-remote --heads origin
