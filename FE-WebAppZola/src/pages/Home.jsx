// src/pages/Home.jsx
"use client" // Keep this if using Next.js App Router

import React from "react" // Import React
import { Modal, Spinner, Toast, ToastContainer } from "react-bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "../styles/home.css" // Your specific styles
import useChat from "../hooks/useChat" // Import the custom hook
import CreateGroupModal from "../components/CreateGroupModal"
import GroupInfoModal from "../components/GroupInfoModal"

// --- Presentational Component ---

const Home = () => {
  const {
    // State
    user,
    contacts, // Use full list for counts or specific checks if needed
    groups,   // Use full list for counts or specific checks if needed
    selectedContact,
    messages,
    newMessage,
    isConnected,
    showEmojiPicker,
    searchQuery,
    mediaFiles,
    documents,
    showMedia,
    showFiles,
    activeTab,
    showProfileModal,
    profileData,
    loading, // Use loading state for spinners etc.
    showAddFriendModal,
    friendEmail,
    error,
    showToast,
    friendRequests,
    showCreateGroupModal,
    showGroupInfoModal,
    selectedGroup, // Pass selectedGroup to GroupInfoModal

    // Setters
    setNewMessage,
    setShowEmojiPicker,
    setSearchQuery,
    setShowProfileModal,
    setProfileData,
    setShowAddFriendModal,
    setFriendEmail,
    setShowToast,
    setShowCreateGroupModal,
    setShowGroupInfoModal,

    // Refs
    messagesEndRef,
    fileInputRef,
    imageInputRef,
    videoInputRef,

    // Handlers
    handleContactSelect,
    handleSendMessage,
    handleSendFile, // Use the consolidated handler
    handleEmojiSelect,
    handleMessageAction,
    toggleMediaView,
    toggleFilesView,
    handleTabChange,
    handleProfileClick,
    handleCloseProfileModal,
    handleAvatarChange, // Pass the file directly
    handleUpdateProfile,
    handleAddFriend,
    handleCloseAddFriendModal,
    handleSubmitAddFriend,
    handleRespondToFriendRequest,
    handleRemoveFriend,
    handleCreateGroup,
    handleGroupCreated,
    handleGroupInfo,
    handleGroupUpdated,
    handleLeaveGroup,
    handleDeleteGroup,
    // showError, // Not called directly from JSX

    // Derived Data
    filteredContacts,
    filteredGroups,
    emojis,
    token, // Get token from hook
  } = useChat()

  // Specific handlers for file inputs that call the main handler
  const handleFileSelectEvent = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleSendFile(file, "file")
    }
    if (fileInputRef.current) fileInputRef.current.value = null // Reset input
  }
  const handleImageSelectEvent = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleSendFile(file, "image")
    }
    if (imageInputRef.current) imageInputRef.current.value = null // Reset input
  }
  const handleVideoSelectEvent = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleSendFile(file, "video")
    }
    if (videoInputRef.current) videoInputRef.current.value = null // Reset input
  }
  const handleAvatarChangeEvent = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleAvatarChange(file) // Pass file to hook handler
    }
    // No need to reset avatar input usually
     if (e.target) e.target.value = null; // Reset file input
  }

  return (
    <div className="chat-app">
      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}> {/* Ensure high z-index, top-end is usually better */}
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={error?.includes("thành công") ? 'success' : 'danger'} > {/* Dynamic background */}
          <Toast.Header closeButton={true}> {/* Ensure close button shows */}
            <strong className="me-auto">{error?.includes("thành công") ? 'Thành công' : 'Thông báo'}</strong>
          </Toast.Header>
          <Toast.Body className={error?.includes("thành công") ? 'text-white' : ''}>{error}</Toast.Body> {/* White text for success */}
        </Toast>
      </ToastContainer>

      {/* Sidebar trái */}
      <div className="sidebar left-sidebar">
        <div className="user-avatar" onClick={handleProfileClick}>
          <div className="avatar-circle pointer">
            {user.avatar ? (
              <img src={user.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() || "U"}</span> // Add fallback
            )}
          </div>
        </div>
        <div className="sidebar-taskbar">
          <button
            className={`taskbar-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => handleTabChange("chat")}
            title="Tin nhắn"
          >
            <i className="bi bi-chat"></i>
          </button>
          <button
            className={`taskbar-btn ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => handleTabChange("contacts")}
            style={{ position: "relative" }}
            title="Danh bạ"
          >
            <i className="bi bi-people"></i>
            {friendRequests.length > 0 && <span className="request-badge">{friendRequests.length}</span>}
          </button>
        </div>
        <div className="setting-btn">
          <button
            className={`taskbar-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleTabChange("settings")}
            title="Cài đặt"
          >
            <i className="bi bi-gear"></i>
          </button>
        </div>
      </div>

      {/* Danh sách chat / Danh bạ / Cài đặt */}
      <div className="chat-list-panel">
        <div className="search-container">
          <div className="search-input-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="user-buttons">
            <button className="user-button" onClick={handleAddFriend} title="Thêm bạn">
              <i className="bi bi-person-plus"></i>
            </button>
            <button className="user-button" onClick={handleCreateGroup} title="Tạo nhóm">
              <i className="bi bi-people-fill"></i>
            </button>
          </div>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="contact-list">
            {loading && contacts.length === 0 && groups.length === 0 ? ( // Show spinner only on initial load
              <div className="d-flex justify-content-center p-3">
                 <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <>
                {/* Groups */}
                {filteredGroups.length > 0 && (
                  <div className="groups-section mb-3">
                    <div className="section-title">Nhóm ({filteredGroups.length})</div>
                    {filteredGroups.map((group) => (
                      <div
                        key={group.groupId}
                        className={`contact-item ${
                          selectedContact?.id === group.groupId && selectedContact?.type === "group" ? "active" : ""
                        }`}
                        onClick={() => handleContactSelect(group)}
                      >
                        <div className="contact-avatar">
                          <div className="avatar-circle">
                            {group.avatar ? (
                              <img src={group.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                            ) : (
                              <span>{group.name?.charAt(0) || "G"}</span>
                            )}
                          </div>
                        </div>
                        <div className="contact-details">
                          <div className="contact-name">{group.name}</div>
                          <div className="contact-status small text-muted">{group.memberCount || 0} thành viên</div>
                        </div>
                        {/* Optional: Add quick actions like info button */}
                         <div className="contact-actions ms-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => handleGroupInfo(group)}
                            title="Thông tin nhóm"
                          >
                            <i className="bi bi-info-circle"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contacts */}
                {filteredContacts.length > 0 && (
                  <div className="contacts-section">
                    <div className="section-title">Bạn bè ({filteredContacts.length})</div>
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`contact-item ${
                          selectedContact?.id === contact.id && selectedContact?.type === "contact" ? "active" : ""
                        }`}
                        onClick={() => handleContactSelect(contact)}
                      >
                        <div className="contact-avatar">
                          <div className="avatar-circle">
                            {contact.avatar ? (
                              <img src={contact.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                            ) : (
                              <span>{contact.name?.charAt(0) || "C"}</span>
                            )}
                          </div>
                        </div>
                        <div className="contact-details">
                          <div className="contact-name">{contact.name}</div>
                          {contact.lastMessage && (
                            <div className="contact-status small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                              {contact.lastMessage.content || (contact.lastMessage.type === "image" ? "Hình ảnh" : contact.lastMessage.type === "video" ? "Video" : "Tệp đính kèm")}
                            </div>
                          )}
                        </div>
                        {contact.unreadCount > 0 && (
                          <div className="unread-badge">
                            {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                          </div>
                        )}
                         {/* Optional: Add quick actions like remove friend */}
                         <div className="contact-actions ms-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-light text-danger"
                            onClick={() => handleRemoveFriend(contact.id)}
                            title="Xóa bạn"
                          >
                            <i className="bi bi-person-dash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!loading && filteredGroups.length === 0 && filteredContacts.length === 0 && (
                  <div className="no-content-message p-3 text-center text-muted">
                    Không tìm thấy cuộc trò chuyện nào.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div className="contacts-panel"> {/* Use a different class if needed */}
            <div className="section-title">Danh bạ</div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="friend-requests-section mb-3">
                <div className="sub-section-title">Lời mời kết bạn ({friendRequests.length})</div>
                {loading && friendRequests.length === 0 ? ( // Spinner only if loading and no requests yet
                   <div className="d-flex justify-content-center p-3">
                     <Spinner animation="border" variant="primary" size="sm"/>
                   </div>
                ) : (
                  <div className="friend-requests-list">
                    {friendRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="friend-request-item d-flex justify-content-between align-items-center p-2 border-bottom"
                      >
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            <div className="avatar-circle small">
                              {request.sender?.avatarUrl ? (
                                <img
                                  src={request.sender.avatarUrl || "/placeholder.svg"}
                                  alt="Avatar"
                                  className="avatar-img"
                                />
                              ) : (
                                <span>{request.sender?.fullName ? request.sender.fullName.charAt(0) : "?"}</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="fw-bold small">{request.sender?.fullName || request.sender?.email}</div>
                            <div className="text-muted small fst-italic">{request.message || "Muốn kết bạn"}</div>
                          </div>
                        </div>
                        <div className="d-flex">
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleRespondToFriendRequest(request.requestId, "accept")}
                            disabled={loading} // Disable while processing
                            title="Chấp nhận"
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRespondToFriendRequest(request.requestId, "reject")}
                            disabled={loading} // Disable while processing
                            title="Từ chối"
                          >
                             <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Friends List */}
            <div className="contacts-list-section">
              <div className="sub-section-title">Bạn bè ({contacts.filter(c => c.type === 'contact').length})</div> {/* Use full contacts list for count */}
              <div className="contact-list">
                {loading && contacts.filter(c => c.type === 'contact').length === 0 ? ( // Spinner only if loading and no contacts yet
                   <div className="d-flex justify-content-center p-3">
                     <Spinner animation="border" variant="primary" />
                   </div>
                ) : contacts.filter(c => c.type === 'contact').length > 0 ? (
                  contacts // Map over the full contacts list, filtering inline
                    .filter((c) => c.type === "contact")
                    .filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase())) // Apply search filter here
                    .map((contact) => (
                    <div
                      key={contact.id}
                      className={`contact-item ${selectedContact?.id === contact.id && selectedContact?.type === 'contact' ? 'active' : ''}`}
                      onClick={() => { handleContactSelect(contact); handleTabChange('chat'); }} // Switch to chat tab on select
                    >
                      <div className="contact-avatar">
                        <div className="avatar-circle">
                          {contact.avatar ? (
                            <img src={contact.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                          ) : (
                            <span>{contact.name?.charAt(0) || "C"}</span>
                          )}
                        </div>
                      </div>
                      <div className="contact-details">
                        <div className="contact-name">{contact.name}</div>
                        {/* <div className="contact-status">{contact.status}</div> */}
                      </div>
                       <div className="contact-actions ms-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-light text-danger"
                            onClick={() => handleRemoveFriend(contact.id)}
                            title="Xóa bạn"
                          >
                            <i className="bi bi-person-dash"></i>
                          </button>
                        </div>
                    </div>
                  ))
                ) : (
                  <div className="no-content-message p-3 text-center text-muted">Bạn chưa có bạn bè nào.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="settings-section p-3">
            <div className="section-title">Cài đặt</div>
            <div className="settings-list">
              {/* Placeholder Settings Items */}
              <div className="setting-item p-2 border-bottom d-flex align-items-center" style={{cursor: 'pointer'}} onClick={handleProfileClick}>
                <div className="setting-icon me-2"><i className="bi bi-person-circle"></i></div>
                <div className="setting-details">Hồ sơ</div>
              </div>
              <div className="setting-item p-2 border-bottom d-flex align-items-center" style={{cursor: 'pointer'}}>
                 <div className="setting-icon me-2"><i className="bi bi-bell"></i></div>
                 <div className="setting-details">Thông báo</div>
              </div>
              <div className="setting-item p-2 border-bottom d-flex align-items-center" style={{cursor: 'pointer'}}>
                 <div className="setting-icon me-2"><i className="bi bi-shield-lock"></i></div>
                 <div className="setting-details">Bảo mật</div>
              </div>
               <div className="setting-item p-2 text-danger d-flex align-items-center" style={{cursor: 'pointer'}} onClick={() => { if(window.confirm('Bạn có chắc muốn đăng xuất?')) { localStorage.clear(); window.location.href = '/login'; } }}>
                 <div className="setting-icon me-2"><i className="bi bi-box-arrow-right"></i></div>
                 <div className="setting-details">Đăng xuất</div>
              </div>
              {/* Add more settings later */}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
        {selectedContact ? (
          <>
            <div className="chat-header">
              <div className="chat-contact-info">
                <div className="contact-avatar me-2">
                  <div className="avatar-circle">
                    {selectedContact.avatar ? (
                      <img src={selectedContact.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                    ) : (
                      <span>{selectedContact.name?.charAt(0) || "?"}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="contact-name">{selectedContact.name}</div>
                  <div className="active-status small text-muted">
                    {selectedContact.type === "group"
                      ? `${selectedContact.memberCount || 0} thành viên`
                      : selectedContact.status || "Online"} {/* Placeholder status */}
                  </div>
                </div>
              </div>
              <div className="chat-actions">
                <button className="action-btn" title="Gọi thoại (chưa có)">
                  <i className="bi bi-telephone"></i>
                </button>
                <button className="action-btn" title="Gọi video (chưa có)">
                  <i className="bi bi-camera-video"></i>
                </button>
                {selectedContact.type === "group" && (
                    <button
                    className="action-btn"
                    onClick={() => handleGroupInfo(selectedContact)}
                    title="Thông tin nhóm"
                    >
                    <i className="bi bi-info-circle"></i>
                    </button>
                )}
                 {/* Add search in chat button? */}
              </div>
            </div>

            <div className="messages-container">
              {!isConnected && <div className="connection-status text-center text-warning p-1 small">Đang kết nối lại...</div>}
              {loading && messages.length === 0 && <div className="d-flex justify-content-center p-5"><Spinner animation="border" variant="primary"/></div>} {/* Loading messages */}

              {messages.map((message) => (
                <div
                  key={message.id} // Use message ID as key
                  className={`message ${
                    message.isSystemMessage ? "system" : message.senderId === user.id ? "sent" : "received"
                  }`}
                >
                  {/* Avatar for received messages */}
                  {message.senderId !== user.id && !message.isSystemMessage && (
                    <div className="message-avatar">
                      <div className="avatar-circle small">
                        {/* Find sender avatar (might need lookup if group message) */}
                        {selectedContact?.type === 'contact' && selectedContact?.avatar ? (
                          <img src={selectedContact.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                        ) : selectedContact?.type === 'group' ? (
                           // Find member avatar in group (complex, maybe skip for now or show initial)
                           <span>{message.sender?.charAt(0) || '?'}</span>
                        ) : (
                          <span>{message.sender?.charAt(0) || "?"}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className={`message-content-wrapper ${message.senderId === user.id ? "align-items-end" : "align-items-start"}`}>
                     {/* Sender Name for received group messages */}
                     {selectedContact?.type === 'group' && message.senderId !== user.id && !message.isSystemMessage && (
                        <div className="message-sender-name small text-muted mb-1">{message.sender}</div>
                     )}

                    {message.isSystemMessage ? (
                      <div className="system-message-bubble">
                        <div className="system-message-content small">
                          {/* <i className="bi bi-info-circle me-1"></i> */}
                          {message.content}
                        </div>
                        {/* <div className="message-time small">{message.time}</div> */}
                      </div>
                    ) : (
                      <>
                        <div className={`message-bubble ${message.isSending ? 'sending' : ''} ${message.isError ? 'error' : ''}`}>
                          {message.isUnsent ? (
                            <div className="unsent-content fst-italic text-muted">{message.content}</div>
                          ) : message.isFile ? (
                            <div className="file-content d-flex align-items-center">
                              <i className={`bi bi-file-earmark${message.fileType?.includes('pdf') ? '-pdf' : message.fileType?.includes('word') ? '-word' : ''} fs-4 me-2`}></i>
                              <div>
                                <a href={message.fileUrl} download={message.fileName} className="text-break">
                                  {message.fileName}
                                </a>
                                {/* Add file size? */}
                              </div>
                            </div>
                          ) : message.isImage ? (
                            <div className="image-content">
                              <img src={message.content || "/placeholder.svg"} alt="Sent content" style={{maxWidth: '250px', maxHeight: '300px', borderRadius: '8px'}}/>
                            </div>
                          ) : message.isVideo ? (
                            <div className="video-content position-relative">
                              <video src={message.content} controls style={{maxWidth: '250px', maxHeight: '300px', borderRadius: '8px'}}></video>
                              {message.duration && <div className="video-duration-overlay">{message.duration}s</div>}
                            </div>
                          ) : (
                            <div className="text-content" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>
                          )}
                           {message.isSending && <Spinner animation="border" size="sm" className="ms-2 sending-spinner"/>}
                           {message.isError && <i className="bi bi-exclamation-circle-fill text-danger ms-2" title="Gửi lỗi"></i>}
                        </div>
                        <div className="message-time small text-muted mt-1">{message.time}</div>

                        {/* Message Actions (Delete/Recall) */}
                        {message.senderId === user.id && !message.isUnsent && !message.isSending && !message.isSystemMessage && (
                          <div className="message-actions">
                            <button
                              className="btn btn-sm btn-light"
                              onClick={() => handleMessageAction(message.id, "delete")}
                              title="Xóa tin nhắn"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            {/* Add Recall button later */}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* For scrolling */}
            </div>

            <div className="message-input-area">
              {/* Input Tools */}
              <div className="input-tools">
                <button className="tool-btn" onClick={() => fileInputRef.current?.click()} title="Đính kèm file">
                  <i className="bi bi-paperclip"></i>
                </button>
                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelectEvent} />

                <button className="tool-btn" onClick={() => imageInputRef.current?.click()} title="Gửi hình ảnh">
                  <i className="bi bi-image"></i>
                </button>
                <input type="file" ref={imageInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageSelectEvent} />

                <button className="tool-btn" onClick={() => videoInputRef.current?.click()} title="Gửi video">
                  <i className="bi bi-camera-video"></i>
                </button>
                <input type="file" ref={videoInputRef} accept="video/*" style={{ display: "none" }} onChange={handleVideoSelectEvent} />

                 <button className="tool-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Biểu cảm">
                   <i className="bi bi-emoji-smile"></i>
                 </button>

                {/* <button className="tool-btn" title="Ghi âm (chưa có)">
                  <i className="bi bi-mic"></i>
                </button> */}
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji, index) => (
                    <button key={index} className="emoji-btn" onClick={() => handleEmojiSelect(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Form */}
              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={!isConnected || loading} // Disable while loading messages too?
                  className="message-input"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }} // Send on Enter
                />
                <button
                  type="submit"
                  className="send-btn"
                  disabled={!isConnected || !newMessage.trim() || loading}
                  title="Gửi"
                >
                  <i className="bi bi-send"></i>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="text-center p-5">
              <i className="bi bi-chat-dots display-1 text-muted"></i>
              <p className="mt-3">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar (Contact/Group Info) */}
      <div className={`sidebar right-sidebar ${selectedContact ? 'active' : ''}`}> {/* Toggle visibility */}
        {selectedContact ? (
          <>
            <div className="contact-profile p-3 text-center border-bottom">
              <div className="avatar-circle large mx-auto mb-2">
                {selectedContact.avatar ? (
                  <img src={selectedContact.avatar || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                ) : (
                  <span>{selectedContact.name?.charAt(0) || "?"}</span>
                )}
              </div>
              <h5 className="profile-name mb-1">{selectedContact.name}</h5>
              {selectedContact.type === "group" && (
                <div className="group-info">
                  <span className="badge bg-secondary">{selectedContact.memberCount || 0} thành viên</span>
                </div>
              )}
               {/* Add more profile actions/info here */}
               {selectedContact.type === 'contact' && (
                 <div className="mt-2">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveFriend(selectedContact.id)}>
                        <i className="bi bi-person-dash me-1"></i> Xóa bạn
                    </button>
                 </div>
               )}
                {selectedContact.type === 'group' && (
                 <div className="mt-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleGroupInfo(selectedContact)}>
                        <i className="bi bi-info-circle me-1"></i> Thông tin nhóm
                    </button>
                 </div>
               )}
            </div>

            {/* <div className="profile-actions p-2 border-bottom">
              <div className="action-item d-flex align-items-center p-2">
                <div className="action-icon me-2"><i className="bi bi-bell"></i></div>
                <div className="action-text">Tắt thông báo</div>
              </div>
               <div className="action-item d-flex align-items-center p-2">
                 <div className="action-icon me-2"><i className="bi bi-pin-angle"></i></div>
                 <div className="action-text">Ghim hội thoại</div>
               </div>
            </div> */}

            <div className="additional-info p-2">
              <div className="info-section">
                <div className="media-tabs nav nav-tabs nav-fill mb-2">
                   <button className={`nav-link ${showMedia ? "active" : ""}`} onClick={toggleMediaView}>
                     <i className="bi bi-images me-1"></i> Ảnh/Video ({mediaFiles.length})
                   </button>
                   <button className={`nav-link ${showFiles ? "active" : ""}`} onClick={toggleFilesView}>
                     <i className="bi bi-file-earmark me-1"></i> File ({documents.length})
                   </button>
                </div>

                {/* Files List */}
                {showFiles && (
                  <div className="files-list overflow-auto" style={{maxHeight: 'calc(100vh - 300px)'}}> {/* Adjust maxHeight */}
                    {documents.length > 0 ? (
                      documents.map((file) => (
                        <div key={file.id} className="file-item d-flex align-items-center p-2 border-bottom">
                          <div className="file-icon me-2">
                            <i className={`bi bi-file-earmark${file.type === "pdf" ? "-pdf text-danger" : file.type === "docx" ? "-word text-primary" : ""} fs-4`}></i>
                          </div>
                          <div className="file-info overflow-hidden">
                            <div className="file-name text-truncate small fw-bold">{file.name}</div>
                            <div className="file-meta small text-muted">
                              {file.date}
                              {file.size > 0 && <span className="file-size"> · {(file.size / (1024 * 1024)).toFixed(2)}MB</span>}
                            </div>
                          </div>
                           <a href={file.url} download={file.name} className="ms-auto btn btn-sm btn-light" title="Tải xuống">
                               <i className="bi bi-download"></i>
                           </a>
                        </div>
                      ))
                    ) : (
                      <div className="no-content-message text-center text-muted p-3">Chưa có file nào.</div>
                    )}
                  </div>
                )}

                {/* Media Grid */}
                {showMedia && (
                  <div className="media-grid overflow-auto" style={{maxHeight: 'calc(100vh - 300px)'}}> {/* Adjust maxHeight */}
                    {mediaFiles.length > 0 ? (
                      mediaFiles.map((file) => (
                        <div key={file.id} className="media-item position-relative">
                          {file.type === "image" ? (
                            <img src={file.url || "/placeholder.svg"} alt={file.name} className="media-thumbnail" />
                          ) : (
                            <div className="video-thumbnail">
                              <video src={file.url} className="media-thumbnail" preload="metadata"></video> {/* Preload metadata */}
                              <div className="play-icon"><i className="bi bi-play-fill"></i></div>
                              {file.duration && <div className="video-duration">{Math.round(file.duration)}s</div>} {/* Round duration */}
                            </div>
                          )}
                           {/* Add overlay for info or download? */}
                        </div>
                      ))
                    ) : (
                      <div className="no-content-message text-center text-muted p-3">Chưa có ảnh/video nào.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
             <div className="no-content-message text-center text-muted p-5">
                <p>Chọn một liên hệ hoặc nhóm để xem thông tin.</p>
             </div>
        )}
      </div>

      {/* Modal Profile */}
      <Modal show={showProfileModal} onHide={handleCloseProfileModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật hồ sơ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
             <div className="avatar-circle large mx-auto mb-2 position-relative">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="avatar-img" />
                ) : (
                  <span>{profileData.fullName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || "U"}</span>
                )}
                 <label className="avatar-edit-button">
                    <i className="bi bi-pencil-fill"></i>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChangeEvent} />
                 </label>
              </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Họ và tên</label>
            <input
              type="text"
              value={profileData.fullName || ""}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              placeholder="Nhập họ và tên"
              className="form-control"
            />
          </div>
          <div className="mb-3">
             <label className="form-label">Ngày sinh</label>
            <input
              type="date"
              value={profileData.birthdate || ""}
              onChange={(e) => setProfileData({ ...profileData, birthdate: e.target.value })}
              className="form-control"
            />
          </div>
          <div className="mb-3">
             <label className="form-label">Giới tính</label>
            <select
              value={profileData.gender || ""}
              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
              className="form-select"
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
              <option value="Không chia sẻ">Không muốn nói</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleCloseProfileModal}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={handleUpdateProfile} disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Lưu thay đổi"}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal Add Friend */}
      <Modal show={showAddFriendModal} onHide={handleCloseAddFriendModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thêm bạn mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Nhập địa chỉ email của người bạn muốn kết bạn:</p>
          <div className="mb-3">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="example@email.com"
              className="form-control"
              autoFocus
            />
          </div>
        </Modal.Body>
         <Modal.Footer>
           <button type="button" className="btn btn-secondary" onClick={handleCloseAddFriendModal}>
             Hủy
           </button>
           <button type="button" className="btn btn-primary" onClick={handleSubmitAddFriend} disabled={loading || !friendEmail.trim()}>
             {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Gửi lời mời"}
           </button>
         </Modal.Footer>
      </Modal>

      {/* Modal Create Group */}
      {showCreateGroupModal && ( // Conditionally render modal to ensure fresh state if needed
          <CreateGroupModal
            show={showCreateGroupModal}
            onHide={() => setShowCreateGroupModal(false)}
            onGroupCreated={handleGroupCreated}
            token={token} // Pass token from hook
            userId={user.id} // Pass userId from hook
          />
      )}

      {/* Modal Group Info */}
      {showGroupInfoModal && selectedGroup && ( // Conditionally render and ensure group data exists
          <GroupInfoModal
            show={showGroupInfoModal}
            onHide={() => setShowGroupInfoModal(false)}
            group={selectedGroup} // Pass selected group from hook state
            token={token} // Pass token from hook
            userId={user.id} // Pass userId from hook
            onGroupUpdated={handleGroupUpdated}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
       )}

    </div>
  )
}

export default Home
