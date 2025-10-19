import React, { useState, useCallback, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  Shield,
  UserCheck,
  Download,
  X,
  AlertCircle,
  RefreshCw,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { adminService, type AdminUser } from "../../services/adminService";
import { instructorService } from "../../services/instructorService";
import { TableSkeleton } from "../../components/LoadingStates/ModernLoader";
import toast from "react-hot-toast";

const AdminUserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AdminUser | null>(
    null
  );
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [instructors, setInstructors] = useState<
    {
      id: string;
      name: string;
      email: string;
      active: boolean;
      _count: { studentsAssigned: number };
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch users with real API
  const {
    data: usersResponse,
    loading: usersLoading,
    refresh: refetchUsers,
  } = useOptimizedData(
    useCallback(
      () =>
        adminService.getUsers({
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          search: searchQuery || undefined,
          page,
          limit,
        }),
      [roleFilter, searchQuery, page, limit]
    ),
    [roleFilter, searchQuery, page, limit],
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const users = usersResponse?.users || [];
  const pagination = usersResponse?.pagination;

  // Fetch instructors for assignment dropdown
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const instructorsData = await adminService.getInstructors();
        setInstructors(instructorsData);
      } catch (error) {
        console.error("Error fetching instructors:", error);
        toast.error("Failed to load instructors");
      }
    };

    fetchInstructors();
  }, []);

  // Create a reliable refresh function
  const refreshUsersList = useCallback(async () => {
    try {
      if (typeof refetchUsers === "function") {
        await refetchUsers();
      } else {
        // Fallback: reload the page
        console.warn("refetchUsers not available, reloading page");
        window.location.reload();
      }

      // Also refresh instructors list
      try {
        const instructorsData = await adminService.getInstructors();
        setInstructors(instructorsData);
      } catch (error) {
        console.error("Error refreshing instructors:", error);
      }
    } catch (error) {
      console.error("Error refreshing users list:", error);
      // Final fallback: reload the page
      window.location.reload();
    }
  }, [refetchUsers]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STUDENT",
    studentNumber: "",
    program: "",
    year: "",
    company: "",
    department: "",
    phone: "",
    position: "",
    status: "ACTIVE",
  });

  // Calculate stats from current users
  const stats = {
    total: pagination?.total || 0,
    students: users.filter((u) => u.role === "STUDENT").length,
    coordinators: users.filter((u) => u.role === "COORDINATOR").length,
    instructors: users.filter((u) => u.role === "INSTRUCTOR").length,
    partners: users.filter((u) => u.role === "INDUSTRY_PARTNER").length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
  };

  // Filter users locally for status filter
  const filteredUsers = users.filter((user) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && user.active) ||
      (statusFilter === "INACTIVE" && !user.active);
    return matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "STUDENT",
      studentNumber: "",
      program: "",
      year: "",
      company: "",
      department: "",
      phone: "",
      position: "",
      status: "ACTIVE",
    });
  };

  const handleAddUser = async () => {
    try {
      // Basic validation
      if (!formData.name.trim()) {
        const errorMsg = "Full name is required";
        toast.error(errorMsg);
        alert(errorMsg);
        return;
      }
      if (!formData.email.trim()) {
        const errorMsg = "Email is required";
        toast.error(errorMsg);
        alert(errorMsg);
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        const errorMsg = "Please enter a valid email address";
        toast.error(errorMsg);
        alert(errorMsg);
        return;
      }

      // Student number format validation for students
      if (formData.role === "STUDENT" && formData.studentNumber) {
        if (!/^\d{2}-[A-Z]{2}-\d{4}$/.test(formData.studentNumber)) {
          const errorMsg = "Student number must be in format: 22-UR-0592";
          toast.error(errorMsg);
          alert(errorMsg);
          return;
        }
      }

      console.log("Creating user with data:", formData);
      await adminService.createUser(formData);

      toast.success(`✅ User created! Password sent to ${formData.email}`, {
        duration: 5000,
        style: {
          background: "#10B981",
          color: "white",
          fontWeight: "500",
        },
      });

      setShowAddModal(false);
      resetForm();

      // Show success modal
      setShowSuccessModal(true);

      // Refresh the users list
      await refreshUsersList();
    } catch (error: any) {
      console.error("Create user error:", error);
      let errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create user";

      // Handle specific error cases
      if (errorMsg.includes("Email already exists")) {
        errorMsg =
          "This email address is already registered. Please use a different email.";
      } else if (errorMsg.includes("Invalid refresh token")) {
        errorMsg =
          "Your session has expired. Please refresh the page and try again.";
      } else if (errorMsg.includes("The operation is insecure")) {
        errorMsg =
          "Security error occurred. Please check your connection and try again.";
      }

      toast.error(errorMsg);
      alert(`Error creating user: ${errorMsg}`);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.updateUser(selectedUser.id, formData);
      const successMsg = "User updated successfully";
      toast.success(successMsg);
      alert(successMsg);

      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);

      // Refresh the users list
      await refreshUsersList();
    } catch (error: any) {
      console.error("Update user error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update user";
      toast.error(errorMsg);
      alert(`Error updating user: ${errorMsg}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.deleteUser(selectedUser.id);
      const successMsg = "User deleted successfully";
      toast.success(successMsg);
      alert(successMsg);

      setShowDeleteModal(false);
      setSelectedUser(null);

      // Refresh the users list
      await refreshUsersList();
    } catch (error: any) {
      console.error("Delete user error:", error);
      let errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete user";

      // Handle specific error cases
      if (errorMsg.includes("related data")) {
        errorMsg =
          "Cannot delete this user. The user has related records (documents, logs, etc.) that need to be handled first.";
      } else if (errorMsg.includes("User not found")) {
        errorMsg = "User not found. The user may have already been deleted.";
      } else if (
        errorMsg.includes("500") ||
        errorMsg.includes("Internal server error")
      ) {
        errorMsg =
          "Server error occurred while deleting the user. Please try again or contact support.";
      }

      toast.error(errorMsg);
      alert(`Error deleting user: ${errorMsg}`);
    }
  };

  const handleAssignStudent = (student: AdminUser) => {
    setSelectedStudent(student);
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedStudent || !selectedInstructor) return;

    try {
      await instructorService.assignStudentToInstructor(
        selectedStudent.id,
        selectedInstructor
      );
      toast.success(
        `Student ${selectedStudent.name} assigned to instructor successfully`
      );
      setShowAssignModal(false);
      setSelectedStudent(null);
      setSelectedInstructor("");
      await refreshUsersList();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign student to instructor");
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      studentNumber: user.student?.studentNumber || "",
      program: user.student?.program || "",
      year: user.student?.year?.toString() || "",
      company: user.student?.company?.name || "",
      department: "",
      phone: "",
      position: "",
      status: user.active ? "ACTIVE" : "INACTIVE",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      STUDENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      COORDINATOR:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      INSTRUCTOR:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      INDUSTRY_PARTNER:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactElement> = {
      STUDENT: <Users className="w-4 h-4" />,
      COORDINATOR: <Shield className="w-4 h-4" />,
      INSTRUCTOR: <UserCheck className="w-4 h-4" />,
      INDUSTRY_PARTNER: <Building2 className="w-4 h-4" />,
    };
    return icons[role] || <Users className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center">
            <Users className="w-8 h-8 mr-3" />
            User Management
          </h2>
          <p className="opacity-90 text-lg">
            Manage all users in the INTRAK system
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={refreshUsersList}
          disabled={usersLoading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
          <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Coordinators
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.coordinators}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Instructors
          </p>
          <p className="text-2xl font-bold text-green-600">
            {stats.instructors}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">Partners</p>
          <p className="text-2xl font-bold text-orange-600">{stats.partners}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 dark:text-gray-400">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or student number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="COORDINATOR">Coordinators</option>
            <option value="INSTRUCTOR">Instructors</option>
            <option value="INDUSTRY_PARTNER">Industry Partners</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredUsers.length} of {pagination?.total || 0} users
          {pagination && pagination.pages > 1 && (
            <span className="ml-2">
              (Page {pagination.page} of {pagination.pages})
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 border-b border-gray-100 dark:border-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-xl flex items-center justify-center shadow-sm border border-indigo-200 dark:border-indigo-700">
                        <span className="text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleIcon(user.role)}
                      <span>
                        {user.role.replace("_", " ").replace("INDUSTRY", "IP")}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {user.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="group relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 overflow-hidden"
                        title="Edit User"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Edit className="w-4 h-4 relative z-10" />
                      </button>
                      {user.role === "STUDENT" && (
                        <button
                          onClick={() => handleAssignStudent(user)}
                          className="group relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 overflow-hidden"
                          title="Assign to Instructor"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <UserCheck className="w-4 h-4 relative z-10" />
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="group relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 overflow-hidden"
                        title="Delete User"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Trash2 className="w-4 h-4 relative z-10" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usersLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={4} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : null}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-lg">
                {page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {showAddModal ? "Add New User" : "Edit User"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="user@example.com"
                  title="Enter a valid email address"
                />
              </div>

              {/* Password Information */}
              {showAddModal && (
                <div className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        🔐 Temporary Password Setup
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          • A secure temporary password will be automatically
                          generated
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          • The password will be sent to the user's email
                          address
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          • The user must change the password on their first
                          login
                        </p>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mt-2">
                          📧 Email will be sent to:{" "}
                          <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">
                            {formData.email || "user@example.com"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="STUDENT">Student</option>
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="INDUSTRY_PARTNER">Industry Partner</option>
                </select>
              </div>

              {formData.role === "STUDENT" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Student Number *
                      </label>
                      <input
                        type="text"
                        value={formData.studentNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            studentNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="22-UR-0592"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: YY-DD-NNNN (e.g., 22-UR-0592)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Year *
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({ ...formData, year: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Program *
                    </label>
                    <input
                      type="text"
                      value={formData.program}
                      onChange={(e) =>
                        setFormData({ ...formData, program: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Computer Engineering, Information Technology"
                      title="Enter the academic program name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}

              {(formData.role === "COORDINATOR" ||
                formData.role === "INSTRUCTOR") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Engineering, Computer Science, IT Department"
                      title="Enter the department name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+63-912-345-6789"
                      title="Format: +63-XXX-XXX-XXXX (Philippine mobile number)"
                    />
                  </div>
                </>
              )}

              {formData.role === "INDUSTRY_PARTNER" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="HR Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+63-912-345-6789"
                      title="Format: +63-XXX-XXX-XXXX (Philippine mobile number)"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddUser : handleEditUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {showAddModal ? "Add User" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete User
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedUser.name}</span>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 text-center mb-6">
              This action cannot be undone. All user data will be permanently
              removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              User Created Successfully!
            </h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    Temporary Password Sent
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      • Secure temporary password generated
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      • Password sent to user's email
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      • User must change password on first login
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Assign Student to Instructor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Assign{" "}
              <span className="font-semibold">{selectedStudent.name}</span> to
              an instructor
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Instructor
              </label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose an instructor...</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.email}) -{" "}
                    {instructor._count.studentsAssigned} students
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStudent(null);
                  setSelectedInstructor("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedInstructor}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Assign Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
