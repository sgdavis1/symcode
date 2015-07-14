# SymCode
## A coding guidance system for real-time programming demonstrations

This project is a direct result of my teaching commitments that often include
some prepared in-class, real-time programming examples. These examples are often
organized so that they have a series of steps, each of which will build on
another, and as a whole will demonstrate a proper usage of a certain technology.

The problem is, these demonstrations (no matter how well prepared) often stumble as
my memory will fail me when trying to recreate multiple changes in multiple
files, on the spot, with little room for error. I typically end up fumbling
around my file system looking for the example file that demonstrates the change
I need to make at that particular step, and even once I open it, it takes a
minute for me to spot the difference (especially if each step has a slight
variation from my prepared examples as they will often compound throughout the
demonstration).

*So I reasoned that there absolutely must be a better way.*

### Enter SymCode

This system is built to utilize a tool that does an absolutely stellar job of
recognizing and indicating changes from a version of a file to the next...

**Git**

No surprise there.

For a rapid MVP, I used NodeJS, Express, Swig, and Semantic-UI.

### How it works

Well, to prepare your demonstration, you have to create a local git repository
with a single 'master' branch, and little incremental changes saved as each
commit (preferrably with descriptive 'git log' summaries).

This repo is then placed inside of the 'data' directory and you start the node
app.

```
npm install
node app.js
```

At this point, if you navigate to

``` 
http://localhost:3000/repo/<name_of_your_repo>
```

the project will start up a 'symcode session' which will replay the steps in the
repository using a local branch.

The dashboard will show you the list of steps in the demonstration as well as
the git hash and summary lines, and an accordion of the files and their changes
for the current step. Most importantly, the system will begin polling your disk
for changes to your repo files. As you change and save files, this changes are
shown (nearly instantly) to you and highlighted with the difference from the
repository at that step. After you match your working directory to the
repository files for the next step, a "Next Step" button will appear. This will
allow you to demonstrate the affect of the change at that point, and continue
with the demonstration.

Obviously this is intended as a window in a separate screen from your
presentation screen. Think of it like "Speaker Notes" for your real-time
programming.

## The Future

I really hope that other people check out this project and I get some
encouragement to keep hacking. It is totally in its infancy at this point but
showing a lot of promise. Unfortunately, it works well enough for me now that I
doubt I will keep polishing it unless other people are interested! So, if you
check it out and like it, send me a message, clone and send me pull requests,
etc! 

Thanks for looking,
Steve Davis
