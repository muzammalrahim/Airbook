# Airbook Application

## Description

Airbook project 

### Frameworks and Tools
	Django, React, Next, Mysql, Nginx, Gunicorn

### Local Setup
	- Setup django database settings
	- Run below command in admin, user and guest folder
		npm install
	- Change API path in env file in admin, user and guest folder
	- Run npm start in admin and user folders
	- Run npm run dev in guest folder

### Deployment
	To deploy project on server, follow these commands for admin, user and guest panels

	- Update Code on local
	- Set live path in env for all admin, user and guest panel
	- Run build command in all admin & user folder
		npm run build 
	- Set live database and debug = False in settings.py
	- Commit and Push code
	- Login to putty and go to cd /var/www/Airbook
	- Run following commands
		sudo su
		git add .
		git commit -m "changes from server"
		git pull origin master
	- Activate virtual env
		pipenv shell
	- Collect static files
		python manage.py collectstatic
	- Restart Next 
		Run `npm run build` in next js folder
		Run `pm2 restart next` to restart next
	- Restart gunicorn
		systemctl restart gunicorn
		systemctl restart nginx

