import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  Calendar,
  Users,
  Pin,
  X,
  Send,
  Loader2,
} from "lucide-react";
import {
  announcementService,
  type Announcement,
} from "../../services/announcementService";

type AudienceOption =
  | "ALL"
  | "STUDENTS"
  | "COORDINATORS"
  | "INSTRUCTORS"
  | "INDUSTRY_PARTNERS";

interface CoordinatorAnnouncementsTabProps {
  defaultAudience?: AudienceOption;
}

const CoordinatorAnnouncementsTab: React.FC<CoordinatorAnnouncementsTabProps> = ({
  defaultAudience = "ALL",
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    audience: defaultAudience as AudienceOption,
    type: "info" as "info" | "warning" | "success" | "urgent",
    isPinned: false,
  });

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await announcementService.getAnnouncements();
      const transformedAnnouncements = response.announcements.map(
        (announcement) =>
          announcementService.transformAnnouncement(announcement)
      );
      setAnnouncements(transformedAnnouncements);
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
      setError(err.response?.data?.message || "Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!showCreateModal) {
      setNewAnnouncement((prev) => ({
        ...prev,
        audience: defaultAudience,
      }));
    }
  }, [defaultAudience, showCreateModal]);

  // Track views for all announcements when they are loaded
  useEffect(() => {
    if (announcements.length > 0) {
      // Track views for all announcements (coordinator viewing all announcements)
      announcements.forEach((announcement) => {
        trackAnnouncementView(announcement.id);
      });
    }
  }, [announcements]);

  // Track view when announcement is displayed
  const trackAnnouncementView = async (announcementId: string) => {
    try {
      await announcementService.trackView(announcementId);
    } catch (error) {
      // Silently fail for view tracking to not disrupt user experience
      console.warn("Failed to track view:", error);
    }
  };

  const stats = announcementService.calculateStats(announcements);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500",
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-500",
      success:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-500",
      urgent:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-500",
    };
    return colors[type] || colors.info;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "urgent":
        return <Bell className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await announcementService.createAnnouncement({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        audience: newAnnouncement.audience,
        type: newAnnouncement.type,
        isPinned: newAnnouncement.isPinned,
      });

      // Refresh announcements
      await fetchAnnouncements();

      // Reset form and close modal
      setNewAnnouncement({
        title: "",
        content: "",
        audience: defaultAudience,
        type: "info",
        isPinned: false,
      });

      setShowCreateModal(false);
    } catch (err: any) {
      console.error("Error creating announcement:", err);
      alert(err.response?.data?.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (_announcement: Announcement) => {
    // TODO: Implement edit functionality
    console.log("Edit announcement:", _announcement.id);
    setShowEditModal(true);
  };

  const handleDelete = async (announcement: Announcement) => {
    if (confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
      try {
        await announcementService.deleteAnnouncement(announcement.id);
        await fetchAnnouncements();
      } catch (err: any) {
        console.error("Error deleting announcement:", err);
        alert(err.response?.data?.message || "Failed to delete announcement");
      }
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      // For now, just show a message since pinning functionality isn't implemented in backend
      alert(
        `Announcement ${
          announcement.isPinned ? "unpinned" : "pinned"
        } successfully!`
      );
      // TODO: Implement pin/unpin API endpoint
    } catch (err: any) {
      console.error("Error toggling pin:", err);
      alert("Failed to toggle pin status");
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (announcement.content || announcement.message || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || (announcement.type || "info") === filterType;
    return matchesSearch && matchesType;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading announcements...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Announcements
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage announcements for students
          </p>
        </div>
        <button
          onClick={() => {
            setNewAnnouncement((prev) => ({
              ...prev,
              audience: defaultAudience,
            }));
            setShowCreateModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900 shadow-sm">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 opacity-50" />
          <div className="relative p-5 space-y-3">
            <MessageSquare className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Announcements
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 shadow-sm">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 opacity-50" />
          <div className="relative p-5 space-y-3">
            <Pin className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Pinned
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.pinned}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900 shadow-sm">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 opacity-50" />
          <div className="relative p-5 space-y-3">
            <Calendar className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                This Week
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.thisWeek}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-orange-100 dark:border-orange-900 shadow-sm">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900 opacity-50" />
          <div className="relative p-5 space-y-3">
            <Eye className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Avg. Views
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.avgViews}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Pin className="w-5 h-5 mr-2 text-blue-600" />
            Pinned Announcements
          </h2>
          <div className="space-y-4">
            {pinnedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden border-l-4 ${getTypeColor(
                  announcement.type || "info"
                )}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`p-3 rounded-xl ${getTypeColor(
                          announcement.type || "info"
                        )}`}
                      >
                        {getTypeIcon(announcement.type || "info")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {announcement.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${getTypeColor(
                              announcement.type || "info"
                            )}`}
                          >
                            {announcement.type || "info"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {announcement.content || announcement.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {announcementService.formatDate(
                                announcement.createdAt ||
                                  announcement.createdDate ||
                                  ""
                              )}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>
                              {announcement.createdBy?.name || "Unknown"}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{announcement.views} views</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleTogglePin(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                      title="Unpin"
                    >
                      <Pin className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Announcements */}
      <div>
        {pinnedAnnouncements.length > 0 && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Announcements
          </h2>
        )}
        <div className="space-y-4">
          {regularAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden border-l-4 ${getTypeColor(
                announcement.type || "info"
              )}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${getTypeColor(
                        announcement.type || "info"
                      )}`}
                    >
                      {getTypeIcon(announcement.type || "info")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {announcement.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${getTypeColor(
                            announcement.type || "info"
                          )}`}
                        >
                          {announcement.type || "info"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {announcement.content || announcement.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {announcementService.formatDate(
                              announcement.createdAt ||
                                announcement.createdDate ||
                                ""
                            )}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {announcement.createdBy?.name || "Unknown"}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{announcement.views} views</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleTogglePin(announcement)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Pin"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No announcements found
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Announcement
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      content: e.target.value,
                    })
                  }
                  placeholder="Enter announcement message"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={newAnnouncement.audience}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        audience: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="COORDINATORS">Coordinators Only</option>
                    <option value="INSTRUCTORS">Instructors Only</option>
                    <option value="INDUSTRY_PARTNERS">
                      Industry Partners Only
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.isPinned}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        isPinned: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Pin this announcement
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{submitting ? "Posting..." : "Post Announcement"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Announcement
              </h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-12">
              <Edit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Edit functionality coming soon...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorAnnouncementsTab;
