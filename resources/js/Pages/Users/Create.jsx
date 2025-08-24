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

export default function UserCreate({ auth }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("users.store"), {
            onSuccess: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Create New User
                </h2>
            }
        >
            <Head title="Create User" />

            <div className="py-6">
                <div className="max-w-xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Details</CardTitle>
                            <CardDescription>
                                Fill in the details for the new user account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {/* Name */}
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

                                {/* Email */}
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

                                {/* Password */}
                                <div>
                                    <Label htmlFor="password">Password</Label>
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

                                {/* Confirm Password */}
                                <div>
                                    <Label htmlFor="password_confirmation">
                                        Confirm Password
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

                                {/* Role */}
                                <div>
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("role", value)
                                        }
                                        value={data.role}
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
                                        Create User
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
