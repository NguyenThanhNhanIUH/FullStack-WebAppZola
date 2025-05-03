"use client"

import { useState, useEffect } from "react"
import { Modal, Button, Form, Spinner, ListGroup } from "react-bootstrap"
import axios from "axios"

const API_BASE_URL = "http://localhost:5000"

const GroupInfoModal = ({ show, onHide, group, token, userId, onGroupUpdated, onLeaveGroup, onDeleteGroup }) => {
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState([])
  const [availableContacts, setAvailableContacts] = useState([])
  const [selectedContacts, setSelectedContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)

  useEffect(() => {
    if (show && group) {
      setGroupName(group.name || "")
      fetchGroupDetails()
    }
  }, [show, group])

  const fetchGroupDetails = async () => {
    if (!group || !group.groupId) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/groups/${group.groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const groupData = response.data.group
      setMembers(groupData.members || [])
      setIsAdmin(groupData.adminId === userId)

      // Nếu là admin, tải danh sách bạn bè có thể thêm vào nhóm
      if (groupData.adminId === userId) {
        fetchAvailableContacts(groupData.members.map((member) => member.userId))
      }
    } catch (error) {
      console.error("Error fetching group details:", error)
      setError("Không thể tải thông tin nhóm")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableContacts = async (currentMemberIds) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Lọc ra những người chưa là thành viên nhóm
      const availableFriends = (response.data.friends || []).filter(
        (friend) => !currentMemberIds.includes(friend.userId),
      )

      setAvailableContacts(availableFriends)
    } catch (error) {
      console.error("Error fetching available contacts:", error)
    }
  }

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      setError("Tên nhóm không được để trống")
      return
    }

    try {
      setLoading(true)
      await axios.put(
        `${API_BASE_URL}/api/groups/${group.groupId}`,
        { name: groupName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setIsEditing(false)
      if (onGroupUpdated) {
        onGroupUpdated({ ...group, name: groupName })
      }
    } catch (error) {
      console.error("Error updating group name:", error)
      setError(error.response?.data?.message || "Không thể cập nhật tên nhóm")
    } finally {
      setLoading(false)
    }
  }

  const handleContactSelect = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
    } else {
      setSelectedContacts([...selectedContacts, contactId])
    }
  }

  const handleAddMembers = async () => {
    if (selectedContacts.length === 0) {
      setError("Vui lòng chọn ít nhất một người để thêm vào nhóm")
      return
    }

    try {
      setLoading(true)
      await axios.post(
        `${API_BASE_URL}/api/groups/${group.groupId}/members`,
        { memberIds: selectedContacts },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSelectedContacts([])
      setShowAddMembers(false)
      fetchGroupDetails()
    } catch (error) {
      console.error("Error adding members:", error)
      setError(error.response?.data?.message || "Không thể thêm thành viên")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      setLoading(true)
      await axios.delete(`${API_BASE_URL}/api/groups/${group.groupId}/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      fetchGroupDetails()
    } catch (error) {
      console.error("Error removing member:", error)
      setError(error.response?.data?.message || "Không thể xóa thành viên")
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (window.confirm("Bạn có chắc muốn rời khỏi nhóm này không?")) {
      try {
        setLoading(true)
        await axios.delete(`${API_BASE_URL}/api/groups/${group.groupId}/members/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        onHide()
        if (onLeaveGroup) {
          onLeaveGroup(group.groupId)
        }
      } catch (error) {
        console.error("Error leaving group:", error)
        setError(error.response?.data?.message || "Không thể rời khỏi nhóm")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (window.confirm("Bạn có chắc muốn xóa nhóm này không? Hành động này không thể hoàn tác.")) {
      try {
        setLoading(true)
        await axios.delete(`${API_BASE_URL}/api/groups/${group.groupId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        onHide()
        if (onDeleteGroup) {
          onDeleteGroup(group.groupId)
        }
      } catch (error) {
        console.error("Error deleting group:", error)
        setError(error.response?.data?.message || "Không thể xóa nhóm")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Thông tin nhóm</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && !showAddMembers ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
          </div>
        ) : showAddMembers ? (
          <div className="add-members-section">
            <h5>Thêm thành viên</h5>
            {error && <div className="alert alert-danger">{error}</div>}

            {availableContacts.length > 0 ? (
              <ListGroup className="contact-select-list">
                {availableContacts.map((contact) => (
                  <ListGroup.Item
                    key={contact.userId}
                    className={`d-flex align-items-center ${
                      selectedContacts.includes(contact.userId) ? "selected-contact" : ""
                    }`}
                    onClick={() => handleContactSelect(contact.userId)}
                    action
                  >
                    <div className="contact-avatar me-2">
                      <div className="avatar-circle small">
                        {contact.avatarUrl ? (
                          <img src={contact.avatarUrl || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                        ) : (
                          <span>{contact.fullName?.charAt(0) || "?"}</span>
                        )}
                      </div>
                    </div>
                    <div className="contact-name">{contact.fullName}</div>
                    {selectedContacts.includes(contact.userId) && (
                      <div className="ms-auto">
                        <i className="bi bi-check-circle-fill text-success"></i>
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <div className="text-center text-muted p-3">Không có bạn bè nào có thể thêm vào nhóm</div>
            )}

            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" onClick={() => setShowAddMembers(false)} className="me-2">
                Quay lại
              </Button>
              <Button variant="primary" onClick={handleAddMembers} disabled={loading || selectedContacts.length === 0}>
                {loading ? <Spinner animation="border" size="sm" /> : "Thêm thành viên"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="group-name-section mb-4">
              <h5>Tên nhóm</h5>
              {isEditing ? (
                <Form.Group>
                  <Form.Control
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm"
                  />
                  <div className="d-flex justify-content-end mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setGroupName(group.name || "")
                      }}
                      className="me-2"
                    >
                      Hủy
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleUpdateGroupName} disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : "Lưu"}
                    </Button>
                  </div>
                </Form.Group>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <h4>{groupName}</h4>
                  {isAdmin && (
                    <Button variant="outline-secondary" size="sm" onClick={() => setIsEditing(true)}>
                      <i className="bi bi-pencil"></i> Đổi tên
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="members-section">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Thành viên ({members.length})</h5>
                {isAdmin && (
                  <Button variant="outline-primary" size="sm" onClick={() => setShowAddMembers(true)}>
                    <i className="bi bi-person-plus"></i> Thêm thành viên
                  </Button>
                )}
              </div>

              <ListGroup>
                {members.map((member) => (
                  <ListGroup.Item key={member.userId} className="d-flex align-items-center">
                    <div className="contact-avatar me-2">
                      <div className="avatar-circle small">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl || "/placeholder.svg"} alt="Avatar" className="avatar-img" />
                        ) : (
                          <span>{member.fullName?.charAt(0) || "?"}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="contact-name">{member.fullName}</div>
                      {member.userId === group.adminId && <small className="text-muted">Quản trị viên</small>}
                    </div>
                    {isAdmin && member.userId !== userId && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="ms-auto"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={loading}
                      >
                        <i className="bi bi-person-x"></i>
                      </Button>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>

            <div className="group-actions mt-4">
              <Button variant="outline-danger" onClick={handleLeaveGroup} disabled={loading} className="me-2">
                <i className="bi bi-box-arrow-left"></i> Rời nhóm
              </Button>

              {isAdmin && (
                <Button variant="danger" onClick={handleDeleteGroup} disabled={loading}>
                  <i className="bi bi-trash"></i> Xóa nhóm
                </Button>
              )}
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default GroupInfoModal
