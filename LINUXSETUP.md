# This was tested and compiled on Ubuntu 20.04
### Required libs which need to be pre installed:
- libx11-dev
- libxtst-dev
- libpng-dev

(Those might already be installed, depending on your distro)

```bash
sudo apt-get install libx11-dev libxtst-dev libpng-dev
``` 

After installing those three libraries you can simply execute ```npm install```.

With ```npm start```, you'll start up the dev server as normal.

Starting with version 0.7.11 building a production .deb and .appImage package exceeds the default memory limit of npm, needs to be done via ```NODE_OPTIONS=--max_old_space_size=4096 npm run electron:linux```.

## Notes:
 
If you run into a robot.js error that it cannot find certain libraries, I'd suggest you install apt-file.
```bash
sudo apt-get install apt-file
```
After that
```bash
sudo apt-file update
```
Error example: 
```bash 
<X11/extensions/XTest.h> 
/urs/bin/ld: cannot find -lpng
```
```-l``` indicates that library ```png``` cannot be found

If such case happens
```bash
apt-file search "X11/extensions/XTest.h"
```
It outputs the libs you need to compile the XTest.h file which in this case would be ```libpng-dev```

Simply install the missing lib and try ```npm install``` again.

Repeat until all missing libs are sorted out.

