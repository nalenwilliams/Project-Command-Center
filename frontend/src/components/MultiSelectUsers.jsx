import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, ChevronDown } from 'lucide-react';

const ELEGANT_GOLD = '#C9A961';

const MultiSelectUsers = ({ users = [], selectedUsers = [], onSelectionChange, placeholder = "Select users..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    onSelectionChange(newSelection);
  };

  const handleRemoveUser = (userId) => {
    const newSelection = selectedUsers.filter(id => id !== userId);
    onSelectionChange(newSelection);
  };

  const getSelectedUserNames = () => {
    return selectedUsers.map(userId => {
      const user = users.find(u => u.id === userId);
      return user ? user.username : 'Unknown';
    });
  };

  const selectedUserNames = getSelectedUserNames();

  return (
    <div className="relative">
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedUserNames.map((username, index) => (
            <div
              key={selectedUsers[index]}
              className="flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: ELEGANT_GOLD, color: '#000000' }}
            >
              <span>{username}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-4 w-4 p-0 hover:bg-black hover:bg-opacity-20 text-black"
                onClick={() => handleRemoveUser(selectedUsers[index])}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between bg-black border text-white hover:bg-gray-900"
          style={{ borderColor: ELEGANT_GOLD }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-left">
            {selectedUsers.length === 0 
              ? placeholder 
              : `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected`
            }
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Dropdown Content */}
        {isOpen && (
          <div 
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-black border rounded-md shadow-lg max-h-64 overflow-hidden"
            style={{ borderColor: ELEGANT_GOLD }}
          >
            {/* Search Input */}
            <div className="p-3 border-b" style={{ borderColor: '#374151' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-3 text-gray-400 text-center">
                  No users available (0 users loaded)
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-3 text-gray-400 text-center">
                  No users found ({users.length} total users, search: "{searchTerm}")
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-900 cursor-pointer"
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <div
                        className="w-4 h-4 border-2 rounded mr-3 flex items-center justify-center"
                        style={{ 
                          borderColor: ELEGANT_GOLD,
                          backgroundColor: isSelected ? ELEGANT_GOLD : 'transparent'
                        }}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{user.username}</div>
                        {user.email && (
                          <div className="text-gray-400 text-sm">{user.email}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MultiSelectUsers;