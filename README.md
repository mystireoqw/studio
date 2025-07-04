# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running the Project Locally

Follow these steps to run the project on your local machine after downloading it.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher is recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- Passwordless SSH access to your WireGuard server from the machine running this app.

### 1. Install Dependencies

Navigate to your project's root directory in your terminal and run the following command to install all the necessary packages:

```bash
npm install
```

### 2. Configure Environment Variables

This project requires credentials to connect to your WireGuard server via SSH.

1.  Find the `.env.local.example` file in the project root.
2.  Create a copy of this file and rename it to `.env.local`.
3.  Open the new `.env.local` file and fill in your actual server details:

    ```env
    # The IP address or hostname of your WireGuard server
    WG_HOST=your_server_ip

    # The username for the SSH connection
    WG_USER=your_ssh_user

    # The name of your WireGuard interface on the server (e.g., wg0)
    WG_INTERFACE=wg0
    ```

### 3. Update Client Public Keys

To match the live data from your server with the client names in the dashboard, you must provide the public keys for your clients.

1.  Open the file `src/services/wireguard.ts`.
2.  Find the `clientsDB` array at the top of the file.
3.  Replace the placeholder `REPLACE_WITH_CLIENT_..._PUBLIC_KEY` values with the **actual public keys** of your WireGuard clients.

### 4. Run the Development Server

Once the installation and configuration are complete, run the following command to start the application:

```bash
npm run dev
```

This will start the development server. You should see a message in your terminal indicating that the server is running, usually on port 9002.

### 5. Access the Application

Open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You should now see the WireGuard dashboard running with live data from your server!
