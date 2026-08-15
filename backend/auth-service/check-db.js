const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const Table = require('cli-table3');

(async () => {
    const db = await open({
        filename: './campus.db',
        driver: sqlite3.Database
    });

    const users = await db.all('SELECT id, username, email, role, verification_status FROM users');

    if (users.length === 0) {
        console.log("No users found in database.");
    } else {
        const table = new Table({
            head: ['ID', 'Username', 'Email', 'Role', 'Status']
        });

        users.forEach(u => {
            table.push([u.id, u.username, u.email, u.role, u.verification_status]);
        });

        console.log(table.toString());
    }
})();
