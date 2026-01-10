# Complete guide for Githiub

## 🔄 Team Collaboration Workflow {Github Classroom Collabration}

## TechSprint 2026 – Team Assignment

- **GitHub Classroom Link**  
  https://classroom.github.com/a/Y9iW-vs6

- **Demonstration Videos**  
  Videos explaining how to create a team and add members in a GitHub Classroom assignment:  
  https://drive.google.com/drive/folders/1gJgVDXgXh_6MCyiTPLQZ3PELdqIZpV88?usp=drive_link

- **Google Tech Setup Guides**  
  Documents explaining how to setup some basic Google Technologies:  
[  https://drive.google.com/drive/folders/1gJgVDXgXh_6MCyiTPLQZ3PELdqIZpV88?usp=drive_link
](https://docs.google.com/document/d/18CCbU5NYa7SxY9wyShBPaxaUBElHA4HKcgkOGqnzRu4/edit?usp=sharing)

### Team Lead Setup:
```
1. clone the repo
git clone <classroom-repo-link> .
2.Work on project
git pull
git add .
git commit -m "Initial project setup"
git push origin main
```
### Team Members Setup:
```
1. clone this team repo
 git clone <team-repo-link> .
 git pull origin main
 Make changes
 git pull origin main      # Always sync first
 git add .
 git commit -m "Your feature"
 git push origin main
```

# Setup for Github 
```
Install git from browser and Run
git config --global user.name "Your Name"                 # configure your name
git config --global user.email "your.email@example.com"   # configure your github mail

```
### After this will redirect to Authrization where you can authrize github and work on it.
### for small video for reference = https://www.youtube.com/watch?v=ufKRYe8ZPaw
# Complete Git Commands Reference Guide

## 📋 Essential Git Workflow Commands

### 1. Repository Setup & Cloning
```
git clone <repository-url>          # Clone repository to local
git clone <repository-url> .        # Clone into current directory
git clone -b <branch> <url>         # Clone specific branch
```


### 2. Checking Status \& History

```bash
git status                           # Current working directory status
git log                              # Full commit history
git log --oneline                    # One-line commit history
git log --graph --oneline --all      # Visual branch graph
git diff                             # See unstaged changes
git diff --staged                    # See staged changes
```


### 3. Staging \& Committing

```bash
git add <file>                       # Stage specific file
git add .                            # Stage all changes
git add -A                           # Stage all changes (including deletions)
git commit -m "Your commit message"  # Commit with message
git commit -am "message"             # Stage & commit tracked files
```


### 4. Branch Management

```bash
git branch                           # List branches
git branch -a                        # List all branches (local+remote)
git checkout <branch>                # Switch to branch
git checkout -b <branch>             # Create & switch to new branch
git branch -d <branch>               # Delete local branch
git push origin --delete <branch>    # Delete remote branch
```


### 5. Remote \& Sync Operations

```bash
git pull                             # Fetch & merge from remote
git pull origin main                 # Pull specific branch
git push origin main                 # Push to remote main branch
git push -u origin main              # Push & set upstream
git fetch                            # Fetch remote changes only
git remote -v                        # View remote URLs
```



## ⚠️ Troubleshooting Commands

### Merge Conflicts

```bash
git pull origin main                 # Get latest changes
# Edit conflicted files manually
git add <resolved-files>
git commit -m "Resolve merge conflicts"
git push origin main
```


### Reset \& Undo

```bash
git checkout -- <file>               # Discard changes to file
git reset HEAD <file>                # Unstage file
git reset --hard HEAD                # Discard all local changes
git revert <commit-hash>             # Undo commit safely
```


### Stash Changes (Temporary Save)

```bash
git stash                            # Save uncommitted changes
git stash pop                        # Restore stashed changes
git stash list                       # List stashes
```



## 📱 Quick Copy-Paste Commands

**Daily Workflow:**

```bash
git pull origin main
# Make changes...
git add .
git commit -m "Your descriptive message"
git push origin main
```

**Emergency Reset:**

```bash
git reset --hard origin/main
git pull
```

<h1 style="text-align: center;">  HAPPY HACKATHON </h1>
