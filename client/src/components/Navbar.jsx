import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <h1 className="text-xl font-bold">
                    CVMS
                </h1>

                <div className="flex gap-6">
                    <Link to="/">Home</Link>
                    <Link to="/positions">Positions</Link>
                    <Link to="/profile">Profile</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;