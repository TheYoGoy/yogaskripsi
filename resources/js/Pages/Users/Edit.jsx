import Layout from "@/Layouts/Layout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import InputError from "@/Components/InputError";
import { useEffect } from "react";

export default function UserEdit({ auth, user }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        password: "",
        password_confirmation: "",
        role: user.role,
    });

    useEffect(() => {
        // Reset form data when the user prop changes (e.g., navigating between different user edit pages)
        setData({
            name: user.name,
            email: user.email,
            password: "", // Clear password fields on edit load for security
            password_confirmation: "",
            role: user.role,
        });
    }, [user]);

    const submit = (e) => {
        e.preventDefault();
        put(route("users.update", user.id), {
            onSuccess: () => reset("password", "password_confirmation"), // Clear password fields after successful update
        });
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Edit User
                </h2>
            }
        >
            <Head title="Edit User" />

            <div className="py-6">
                <div className="max-w-xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit User Details</CardTitle>
                            <CardDescription>
                                Update the information for this user account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {/* User Name */}
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                {/* User Email */}
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="email"
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.email}
                                        className="mt-2"
                                    />
                                </div>

                                {/* New Password (Optional) */}
                                <div>
                                    <Label htmlFor="password">
                                        New Password (Optional)
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.password}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Confirm New Password (Optional) */}
                                <div>
                                    <Label htmlFor="password_confirmation">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                        className="mt-2"
                                    />
                                </div>

                                {/* User Role */}
                                <div>
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("role", value)
                                        }
                                        value={data.role}
                                        // Disable changing own role for security/consistency
                                        disabled={user.id === auth.user.id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>
                                            <SelectItem value="manager">
                                                Manager
                                            </SelectItem>
                                            <SelectItem value="staff">
                                                Staff
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.role}
                                        className="mt-2"
                                    />
                                    {user.id === auth.user.id && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            You cannot change your own role.
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end mt-6">
                                    <Link
                                        href={route("users.index")}
                                        className="mr-4"
                                    >
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button disabled={processing}>
                                        Update User
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
