# Elvanto Plus Plus Alpha V0.22

Enhance Elvanto Live Chat with helpful text chat features found in modern text apps.

## Features
- [x] Change the default text chat colours to more readable colours.
- [x] Chat Commands (I.E @Someone)
- [X] Gif support
- [x] Emoji support
- [ ] Control Commands
- [ ] Admin Commands
- [ ] Church Feature Request
- [x] Role permission (Fetch role from the elvanto.com.au/roster page)
- [x] Push Notifications on messages (Mentions) 


## Chat Commands
- [x] @FirstNameLastName, @name, @everyone, @all or @Role (mention person by first, last or full name. That message bubble will be orange for that user)
- [x] /refresh (Refresh all user webpages. User that is in control of the service. Useful for runsheet updates)
- [x] /nick {Nickname} (Allow you to change your name to a nickname. Running this command blank will remove the nickname. Support Emoji)
- [ ] Rich text (standard Discord text chat features in Elvanto chat)
- [ ] Auto fill commands (@someone needs this)

## Custom Buttons
- [x] Refresh button. (ask the user if they want to run the /refresh command)

## Settings Dropdown
- [x] Notifcations Toggle (When Enable @Mention message will push OS Notification)
- [x] Hide Commands in chat
- [x] Hide gif preview in chat


## Role Permissions
To customise feature access for your church, you can submit a pull request to our [asset repository](https://github.com/Nathan31973/Elvanto-Plus-Plus-Assets/tree/main). This is where you can create a permission file to restrict or grant access to specific features in Elvanto Plus Plus. If your church does not have a permission file in the repository, Elvanto Plus Plus will use the default permissions provided in the asset repository.

Features
- [x] Features permission
- [x] Colour names

## Church Feature Request
Make an issue if you want features targeted to how you run elvanto at your local church to be added.
- [x] Citipointe Church (50% done)

## Note
- Kill Switch: Elvanto Plus Plus uses a global kill switch to disable plugin features if a bug disrupts Elvanto Live chat. These kill switches are located in the [asset repository](https://github.com/Nathan31973/Elvanto-Plus-Plus-Assets/tree/main) and only affect plugin features, not Elvanto Live’s default functionality.

- Bug Reporting: If you encounter a bug, please submit an issue on the issue page.

### Install
- Clone the repo
- Unzip
- Go to your extention tab extensions
- Enable Dev mode (Top Right)
- Load Unpacked
- Select Elvanto Plus Plus Folder
