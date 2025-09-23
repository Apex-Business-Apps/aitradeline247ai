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
export OLD_REPO="https://github.com/sinyorlang-design/TradeLine24-7Ai.git"
export NEW_REPO="https://github.com/sinyorlang-design/tradeline-quest.git"

git clone "$NEW_REPO" tl247 && cd tl247
git remote add old "$OLD_REPO"
git fetch old --prune
git checkout -B main old/main || git checkout -B main old/master
git push -f origin main

git ls-remote --heads origin
```0

