# Vacation Auto Replies

This application automatically sends vacation auto-reply emails to unread messages in your Gmail inbox.

## Prerequisites

Before running this application, make sure you have the following:

- Node.js installed on your machine.
- A Google Cloud Platform project set up with the Gmail API enabled and OAuth 2.0 credentials generated.
- `credentials.json` and `token.json` files obtained by setting up OAuth 2.0 authentication.

## Setup

1. Clone this repository.
2. Install dependencies by running: `npm install`.
3. Place your `credentials.json` and `token.json` files in the root directory.

## Configuration

- Ensure that the `credentials.json` and `token.json` files are correctly set up.
- Modify the `labelName` variable in the script to match the label you want to use for identifying threads with auto-replies.

## Usage

Run the application by executing: `node app.js`.

This will begin processing unread messages in your Gmail inbox, sending auto-replies to new threads that haven't received a response yet.

## Important Notes

- The script runs at intervals (random intervals between 45 to 120 seconds by default) to avoid rate limiting by the Gmail API.
- Ensure that the Gmail API is enabled and that the provided OAuth 2.0 credentials have the necessary permissions.

## Disclaimer

This application provides a basic template for sending auto-replies and labeling threads in Gmail. Use it responsibly and test thoroughly before running in a production environment.

**Note:** This Project assumes familiarity with basic Node.js and Google Cloud Platform concepts.
