"use client"

import {useEffect, useState} from "react";
import {login} from "@/services/authService";
import {getUsers, User} from "@/services/userService";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Login (replace with actual credentials)
                const token = await login("admin", "myPassword1$");

                // Fetch users with token
                const data = await getUsers(token);
                setUsers(data);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchUsers();
    }, []);

    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Users</h1>
            <ul>
                {users.map(u => (
                    <li key={u.id}>{u.firstName} {u.lastName} ({u.role})</li>
                ))}
            </ul>
        </div>
    );
}
