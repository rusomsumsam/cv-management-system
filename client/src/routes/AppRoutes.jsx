import { Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

import Dashboard from "../pages/Dashboard";
import SearchResults from "../pages/SearchResults";

import ProtectedRoute from "./ProtectedRoute";

// Recruiter - Positions
import RecruiterPositions from "../pages/recruiter/positions/RecruiterPositions";
import CreatePosition from "../pages/recruiter/positions/CreatePosition";
import RecruiterPositionDetails from "../pages/recruiter/positions/RecruiterPositionDetails";
import EditPosition from "../pages/recruiter/positions/EditPosition";

// Recruiter - Profile
import RecruiterProfile from "../pages/recruiter/profile/RecruiterProfile";

// Candidate - Positions
import CandidatePositions from "../pages/candidate/positions/CandidatePositions";
import CandidatePositionDetails from "../pages/candidate/positions/CandidatePositionDetails";

// Candidate - CVs
import GenerateCV from "../pages/candidate/cvs/GenerateCV";
import CandidateCVs from "../pages/candidate/cvs/CandidateCVs";
import CVDetails from "../pages/candidate/cvs/CVDetails";
import EditCV from "../pages/candidate/cvs/EditCV";

// Recruiter - Attributes
import Attributes from "../pages/recruiter/attributes/Attributes";
import CreateAttribute from "../pages/recruiter/attributes/CreateAttribute";
import AttributeDetails from "../pages/recruiter/attributes/AttributeDetails";
import EditAttribute from "../pages/recruiter/attributes/EditAttribute";

// Candidate - Profile Attributes
import UserAttributes from "../pages/candidate/profile/UserAttributes";
import AddUserAttribute from "../pages/candidate/profile/AddUserAttribute";
import UserAttributeDetails from "../pages/candidate/profile/UserAttributeDetails";
import EditUserAttribute from "../pages/candidate/profile/EditUserAttribute";
import Profile from "../pages/candidate/profile/Profile";

import CreateProject from "../pages/candidate/projects/CreateProject";
import ProjectDetails from "../pages/candidate/projects/ProjectDetails";
import EditProject from "../pages/candidate/projects/EditProject";
import Projects from "../pages/candidate/projects/Projects";

import PositionAttributes from "../pages/recruiter/positions/PositionAttributes";
import GeneratedCVView from "../pages/candidate/cvs/GeneratedCVView";

import Discussions from "../pages/discussions/Discussions";
import CreateDiscussion from "../pages/discussions/CreateDiscussion";
import DiscussionDetails from "../pages/discussions/DiscussionDetails";

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected Routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                {/* Search Results */}
                <Route
                    path="/search"
                    element={<SearchResults />}
                />

                {/* Recruiter Profile */}
                <Route
                    path="/recruiter/profile"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <RecruiterProfile />
                        </ProtectedRoute>
                    }
                />

                {/* Recruiter Positions */}
                <Route
                    path="/positions"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <RecruiterPositions />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/positions/create"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <CreatePosition />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/positions/:id"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <RecruiterPositionDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/positions/edit/:id"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <EditPosition />
                        </ProtectedRoute>
                    }
                />

                {/* Candidate Positions */}
                <Route
                    path="/candidate/positions"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <CandidatePositions />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/candidate/positions/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <CandidatePositionDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Candidate CVs */}
                <Route
                    path="/cvs/generate/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <GenerateCV />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-cvs"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <CandidateCVs />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cvs/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <CVDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cvs/edit/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <EditCV />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/generated-cv/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <GeneratedCVView />
                        </ProtectedRoute>
                    }
                />

                {/* Recruiter Attributes */}
                <Route
                    path="/attributes"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <Attributes />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attributes/create"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <CreateAttribute />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attributes/:id"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <AttributeDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/attributes/edit/:id"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <EditAttribute />
                        </ProtectedRoute>
                    }
                />

                {/* Candidate Projects */}
                <Route
                    path="/projects"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <Projects />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects/create"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <CreateProject />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <ProjectDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/projects/edit/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <EditProject />
                        </ProtectedRoute>
                    }
                />

                {/* Recruiter Position Attributes */}
                <Route
                    path="/positions/:id/attributes"
                    element={
                        <ProtectedRoute allowedRoles={["RECRUITER"]}>
                            <PositionAttributes />
                        </ProtectedRoute>
                    }
                />

                {/* Candidate Profile */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Candidate User Attributes */}
                <Route
                    path="/profile/attributes"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <UserAttributes />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/attributes/add"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <AddUserAttribute />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/attributes/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <UserAttributeDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/attributes/edit/:id"
                    element={
                        <ProtectedRoute allowedRoles={["CANDIDATE"]}>
                            <EditUserAttribute />
                        </ProtectedRoute>
                    }
                />

                {/* Shared Discussions */}
                <Route
                    path="/discussions"
                    element={<Discussions />}
                />

                <Route
                    path="/discussions/create"
                    element={<CreateDiscussion />}
                />

                <Route
                    path="/discussions/:id"
                    element={<DiscussionDetails />}
                />
            </Route>
        </Routes>
    );
};

export default AppRoutes;