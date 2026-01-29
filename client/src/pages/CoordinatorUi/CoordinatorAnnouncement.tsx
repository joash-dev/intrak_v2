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
import { aiService } from "../../services/aiService";
import AIGenerateButton from "../../components/ai/AIGenerateButton";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";

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
  const [editingAnnouncement, setEditingAnnouncement] = useState<{
    id: string;
    title: string;
    content: string;
    audience: AudienceOption;
    type: "info" | "warning" | "success" | "urgent";
    isPinned: boolean;
  } | null>(null);

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

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content || announcement.message || "",
      audience: announcement.audience,
      type: announcement.type || "info",
      isPinned: announcement.isPinned || false,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAnnouncement) return;

    if (!editingAnnouncement.title || !editingAnnouncement.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await announcementService.updateAnnouncement(editingAnnouncement.id, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        audience: editingAnnouncement.audience,
        type: editingAnnouncement.type,
        isPinned: editingAnnouncement.isPinned,
      });

      toast.success("Announcement updated successfully");
      await fetchAnnouncements();
      setShowEditModal(false);
      setEditingAnnouncement(null);
    } catch (err: any) {
      console.error("Error updating announcement:", err);
      toast.error(err.response?.data?.message || "Failed to update announcement");
    } finally {
      setSubmitting(false);
    }
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
      await announcementService.updateAnnouncement(announcement.id, {
        isPinned: !announcement.isPinned,
      });

      toast.success(
        `Announcement ${announcement.isPinned ? "unpinned" : "pinned"} successfully`
      );
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Error toggling pin:", err);
      toast.error("Failed to toggle pin status");
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
  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search/Filter Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        {/* Announcements List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex space-x-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
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
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-3 sm:gap-0">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
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
          className="inline-flex items-center justify-center space-x-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg sm:rounded-xl transition-colors font-medium shadow-sm text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-purple-100 dark:border-purple-900 shadow-sm">
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

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-blue-100 dark:border-blue-900 shadow-sm">
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

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-green-100 dark:border-green-900 shadow-sm">
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

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#212124] border border-orange-100 dark:border-orange-900 shadow-sm">
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
      <div className="bg-white dark:bg-[#212124] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                className={`bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden border-l-4 ${getTypeColor(
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
              className={`bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden border-l-4 ${getTypeColor(
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
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No announcements found
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-red-500">*</span>
                  </label>
                  {newAnnouncement.title && newAnnouncement.audience && (
                    <AIGenerateButton
                      onGenerate={async () => {
                        return aiService.generateAnnouncementContent({
                          title: newAnnouncement.title,
                          audience: newAnnouncement.audience,
                          type: newAnnouncement.type,
                        });
                      }}
                      onSuccess={(generatedText) => {
                        setNewAnnouncement({
                          ...newAnnouncement,
                          content: generatedText,
                        });
                        toast.success('Announcement content generated successfully');
                      }}
                      disabled={!newAnnouncement.title || !newAnnouncement.audience}
                      size="sm"
                      variant="outline"
                    />
                  )}
                </div>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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

      {/* Edit Modal */}
      {showEditModal && editingAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Announcement
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                }}
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
                  value={editingAnnouncement.title}
                  onChange={(e) =>
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-red-500">*</span>
                  </label>
                  {editingAnnouncement.title && editingAnnouncement.audience && (
                    <AIGenerateButton
                      onGenerate={async () => {
                        return aiService.generateAnnouncementContent({
                          title: editingAnnouncement.title,
                          audience: editingAnnouncement.audience,
                          type: editingAnnouncement.type,
                        });
                      }}
                      onSuccess={(generatedText) => {
                        setEditingAnnouncement({
                          ...editingAnnouncement,
                          content: generatedText,
                        });
                        toast.success('Announcement content generated successfully');
                      }}
                      disabled={!editingAnnouncement.title || !editingAnnouncement.audience}
                      size="sm"
                      variant="outline"
                    />
                  )}
                </div>
                <textarea
                  value={editingAnnouncement.content}
                  onChange={(e) =>
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      content: e.target.value,
                    })
                  }
                  placeholder="Enter announcement message"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={editingAnnouncement.type}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        type: e.target.value as "info" | "warning" | "success" | "urgent",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    value={editingAnnouncement.audience}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        audience: e.target.value as AudienceOption,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                    checked={editingAnnouncement.isPinned}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
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
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4" />
                )}
                <span>{submitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinatorAnnouncementsTab;
