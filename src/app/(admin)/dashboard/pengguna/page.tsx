"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Shield,
    Stethoscope,
    UserCheck,
    UserCircle,
    KeyRound,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { User, UserRole } from "@/lib/types";



export default function PenggunaPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch users on mount
    useEffect(() => {
        fetch("/api/users")
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Password reset state
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
    const [newResetPassword, setNewResetPassword] = useState("");
    const [resetPasswordSaved, setResetPasswordSaved] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formRole, setFormRole] = useState<UserRole>("ADMIN");
    const [formPhone, setFormPhone] = useState("");

    const filtered = users.filter(
        (u) =>
            !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    const openAddDialog = () => {
        setEditingUser(null);
        setFormName("");
        setFormEmail("");
        setFormPhone("");
        setFormRole("ADMIN");
        setDialogOpen(true);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setFormName(user.name);
        setFormEmail(user.email);
        setFormPhone(user.phone || "");
        setFormRole(user.role);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (editingUser) {
            try {
                const res = await fetch("/api/users", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingUser.id,
                        name: formName,
                        email: formEmail,
                        role: formRole,
                        phone: formPhone
                    }),
                });
                if (res.ok) {
                    setUsers((prev) =>
                        prev.map((u) =>
                            u.id === editingUser.id
                                ? { ...u, name: formName, email: formEmail, role: formRole, phone: formPhone }
                                : u
                        )
                    );
                }
            } catch (err) {
                console.error("Failed to update user:", err);
            }
        } else {
            const newUser: User = {
                id: `u${Date.now()}`,
                name: formName,
                email: formEmail,
                role: formRole,
                phone: formPhone
            };
            setUsers((prev) => [...prev, newUser]);
        }
        setDialogOpen(false);
    };

    const handleDelete = () => {
        if (userToDelete) {
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        }
        setDeleteDialogOpen(false);
    };

    const handleApprove = async (userId: string, currentStatus: boolean | undefined) => {
        try {
            const res = await fetch(`/api/users`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, isApproved: !currentStatus }),
            });
            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === userId ? { ...u, isApproved: !currentStatus } : u
                    )
                );
            }
        } catch (err) {
            console.error("Failed to approve user:", err);
        }
    };

    const handleResetPassword = () => {
        // In production: call API
        setResetPasswordSaved(true);
        setTimeout(() => {
            setResetPasswordSaved(false);
            setResetPasswordOpen(false);
            setNewResetPassword("");
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                        Manajemen Pengguna
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola petugas dan hak akses mereka
                    </p>
                </div>
                <Button
                    onClick={openAddDialog}
                    className="gap-2 rounded-xl bg-primary shadow-md shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Pengguna
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Cari nama atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-xl pl-9"
                />
            </div>

            {/* Loading State or Users Table */}
            {isLoading ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-border/50 bg-card">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-12">
                                    <span className="sr-only">Avatar</span>
                                </TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>ID Telegram</TableHead>
                                <TableHead className="w-32">Peran</TableHead>
                                <TableHead className="w-24 text-center">Status</TableHead>
                                <TableHead className="w-24 text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((user) => {
                                let roleLabel = "Pengguna";
                                let RoleIcon = UserCircle;
                                let roleClass = "bg-muted text-muted-foreground border-muted";

                                if (user.role) {
                                    const rKey = user.role.toUpperCase();
                                    if (rKey === "ADMIN") {
                                        roleLabel = "Admin";
                                        RoleIcon = Shield;
                                        roleClass = "bg-primary/10 text-primary border-primary/20";
                                    } else if (rKey === "PSIKOLOG") {
                                        roleLabel = "Psikolog";
                                        RoleIcon = Stethoscope;
                                        roleClass = "bg-teal/10 text-teal border-teal/20";
                                    } else if (rKey === "PETUGAS") {
                                        roleLabel = "Petugas";
                                        RoleIcon = UserCheck;
                                        roleClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                                    } else {
                                        roleLabel = user.role || "Pengguna";
                                    }
                                }

                                return (
                                    <TableRow key={user.id} className="group">
                                        <TableCell>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                                <UserCircle className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {user.phone || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleClass}`}
                                            >
                                                <RoleIcon className="h-3 w-3" />
                                                {roleLabel}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={user.isApproved ? "default" : "secondary"} className={user.isApproved ? "bg-teal text-white hover:bg-teal/80" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"}>
                                                {user.isApproved ? "Aktif" : "Menunggu"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 rounded-lg p-0 opacity-60 transition-opacity group-hover:opacity-100"
                                                    onClick={() => openEditDialog(user)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-8 w-8 rounded-lg p-0 opacity-60 transition-opacity group-hover:opacity-100 ${user.isApproved ? 'text-destructive' : 'text-teal'}`}
                                                    onClick={() => handleApprove(user.id, user.isApproved)}
                                                    title={user.isApproved ? "Nonaktifkan Akses" : "Terima Pendaftaran"}
                                                >
                                                    {user.isApproved ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 rounded-lg p-0 text-amber-600 opacity-60 transition-opacity group-hover:opacity-100"
                                                    onClick={() => {
                                                        setResetPasswordUser(user);
                                                        setNewResetPassword("");
                                                        setResetPasswordOpen(true);
                                                    }}
                                                    title="Reset Password"
                                                >
                                                    <KeyRound className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 rounded-lg p-0 text-destructive opacity-60 transition-opacity group-hover:opacity-100"
                                                    onClick={() => {
                                                        setUserToDelete(user);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        Tidak ada pengguna ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Ubah informasi pengguna di bawah ini."
                                : "Isi data pengguna baru untuk ditambahkan ke sistem."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="userName">Nama Lengkap</Label>
                            <Input
                                id="userName"
                                placeholder="Contoh: Dr. Rina Wahyuni"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="userEmail">Email</Label>
                            <Input
                                id="userEmail"
                                type="email"
                                placeholder="email@sisaka.id"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="userPhone">ID Telegram</Label>
                            <Input
                                id="userPhone"
                                type="text"
                                placeholder="Cth: 12345678"
                                value={formPhone}
                                onChange={(e) => setFormPhone(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="userRole">Peran</Label>
                            <Select
                                value={formRole}
                                onValueChange={(v) => setFormRole(v as UserRole)}
                            >
                                <SelectTrigger id="userRole" className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="ADMIN">
                                        <span className="flex items-center gap-2">
                                            <Shield className="h-3.5 w-3.5" />
                                            Admin
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="PSIKOLOG">
                                        <span className="flex items-center gap-2">
                                            <Stethoscope className="h-3.5 w-3.5" />
                                            Psikolog
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="PETUGAS">
                                        <span className="flex items-center gap-2">
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Petugas
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!formName || !formEmail}
                            className="rounded-xl bg-primary"
                        >
                            {editingUser ? "Simpan Perubahan" : "Tambah Pengguna"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Pengguna</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus{" "}
                            <strong>{userToDelete?.name}</strong>? Tindakan ini tidak dapat
                            dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="rounded-xl"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                <DialogContent className="rounded-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-amber-500" />
                            Reset Password
                        </DialogTitle>
                        <DialogDescription>
                            Atur password baru untuk{" "}
                            <strong>{resetPasswordUser?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="resetNewPassword">Password Baru</Label>
                            <Input
                                id="resetNewPassword"
                                type="password"
                                value={newResetPassword}
                                onChange={(e) => setNewResetPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="rounded-xl"
                            />
                        </div>
                        {resetPasswordSaved && (
                            <p className="flex items-center gap-1 text-sm font-medium text-teal">
                                <CheckCircle2 className="h-4 w-4" />
                                Password berhasil direset!
                            </p>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setResetPasswordOpen(false)}
                            className="rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={newResetPassword.length < 6 || resetPasswordSaved}
                            className="rounded-xl bg-primary"
                        >
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
