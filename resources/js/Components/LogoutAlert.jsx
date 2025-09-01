import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LogoutAlert = ({ open, onOpenChange, onConfirm }) => {
    const handleConfirm = () => {
        onOpenChange(false);
        onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Yakin ingin keluar?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin mengakhiri sesi ini?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/80"
                        onClick={handleConfirm}
                    >
                        Keluar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default LogoutAlert;