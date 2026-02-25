import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UMKMDashboard } from "../components/UMKMDashboard";

export function UMKMDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if not logged in or not UMKM role
    useEffect(() => {
        if (!user) {
            navigate("/");
        } else if (user.role !== "umkm" && user.role !== "admin") {
            navigate("/");
        }
    }, [user, navigate]);

    if (!user || (user.role !== "umkm" && user.role !== "admin")) {
        return null;
    }

    return (
        <div className="min-h-screen pt-20">
            <UMKMDashboard
                isOpen={true}
                onClose={() => navigate("/")}
                onDataUpdate={() => { }}
                asPage={true}
            />
        </div>
    );
}
