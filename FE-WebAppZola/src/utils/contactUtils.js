// Hàm tiện ích để quản lý danh bạ
const contactUtils = {
    // Thêm hoặc cập nhật contact trong danh sách
    addOrUpdateContact: (contacts, newContact) => {
      if (!newContact || !newContact.id) return contacts
  
      // Kiểm tra xem contact đã tồn tại chưa
      const existingIndex = contacts.findIndex((c) => c.id === newContact.id)
  
      // Nếu đã tồn tại, cập nhật thông tin
      if (existingIndex >= 0) {
        const updated = [...contacts]
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...newContact,
          conversationId: newContact.conversationId || updated[existingIndex].conversationId,
        }
        return updated
      }
  
      // Nếu chưa tồn tại, thêm mới
      return [...contacts, newContact]
    },
  
    // Lưu danh sách liên hệ vào localStorage
    saveContactsToStorage: (contacts) => {
      try {
        localStorage.setItem("savedContacts", JSON.stringify(contacts))
        return true
      } catch (error) {
        console.error("Error saving contacts to localStorage:", error)
        return false
      }
    },
  
    // Lấy danh sách liên hệ từ localStorage
    getContactsFromStorage: () => {
      try {
        const savedContacts = localStorage.getItem("savedContacts")
        return savedContacts ? JSON.parse(savedContacts) : []
      } catch (error) {
        console.error("Error getting contacts from localStorage:", error)
        return []
      }
    },
  
    // Xóa contact khỏi danh sách
    removeContact: (contacts, contactId) => {
      return contacts.filter((contact) => contact.id !== contactId)
    },
  
    // Tìm kiếm contact theo tên
    searchContacts: (contacts, query) => {
      if (!query) return contacts
      const lowerQuery = query.toLowerCase()
      return contacts.filter((contact) => contact.name.toLowerCase().includes(lowerQuery))
    },
  }
  
  export default contactUtils
  