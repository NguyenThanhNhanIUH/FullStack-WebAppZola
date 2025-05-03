"use client"

import { useState, useEffect } from "react"
import { Modal, Button, Form, Spinner, ListGroup } from "react-bootstrap"
import axios from "axios"

const API_BASE_URL = "http://localhost:5000"

const CreateGroupModal = ({ show, onHide, onGroupCreated, token, userId }) => {
  const [groupName, setGroupName] = useState("")
  const [selectedContacts, setSelectedContacts] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (show) {
      fetchContacts()
    }
  }, [show])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log("Friends response:", response.data)
      if (response.data && response.data.friends) {
        setContacts(response.data.friends)
      } else {
        setContacts([])
        setError("Không thể tải danh sách bạn bè")
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
      setError("Không thể tải danh sách bạn bè")
      setContacts([])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) {
      setError("Vui lòng nhập tên nhóm")
      return
    }
    if (selectedContacts.length === 0) {
      setError("Vui lòng chọn ít nhất một thành viên")
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(
        `${API_BASE_URL}/api/groups`,
        {
          name: groupName,
          members: [...selectedContacts, userId], // Thêm người tạo nhóm vào danh sách thành viên
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data && response.data.group) {
        onGroupCreated(response.data.group)
        resetForm()
        onHide()
      }
    } catch (error) {
      console.error("Error creating group:", error)
      setError(error.response?.data?.message || "Không thể tạo nhóm")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setGroupName("")
    setSelectedContacts([])
    setError("")
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Tạo nhóm chat mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên nhóm</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên nhóm"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Chọn thành viên</Form.Label>
            {loading ? (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
              </div>
            ) : contacts.length > 0 ? (
              <ListGroup className="contact-select-list">
                {contacts.map((contact) => (
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
                          <img src={contact.avatarUrl} alt="Avatar" className="avatar-img" />
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
              <div className="text-center text-muted">Không có bạn bè nào</div>
            )}
          </Form.Group>

          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Tạo nhóm"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default CreateGroupModal
