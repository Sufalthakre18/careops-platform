'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { inventoryAPI } from '@/lib/api';
import { handleApiError } from '@/lib/utils';
import { Package, Plus, AlertTriangle, TrendingDown } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    quantity: 0,
    unit: 'PIECE',
    lowStockThreshold: 10,
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
  });

  const [adjustData, setAdjustData] = useState({
    adjustment: 0,
    reason: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setItems(response.data.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedItem) {
        // EDIT → only send allowed fields
        await inventoryAPI.update(selectedItem.id, {
          name: formData.name,
          description: formData.description,
          lowStockThreshold: formData.lowStockThreshold,
          vendorName: formData.vendorName,
          vendorEmail: formData.vendorEmail,
          vendorPhone: formData.vendorPhone,
        });

        setAlert({ type: 'success', message: 'Item updated successfully!' });
      } else {
        // CREATE → send full data
        await inventoryAPI.create(formData);
        setAlert({ type: 'success', message: 'Item created successfully!' });
      }

      setShowModal(false);
      setSelectedItem(null);
      resetForm();
      loadItems();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };


  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await inventoryAPI.adjustStock(selectedItem.id, adjustData);
      setAlert({ type: 'success', message: 'Stock adjusted successfully!' });
      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustData({ adjustment: 0, reason: '' });
      loadItems();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await inventoryAPI.delete(id);
      setAlert({ type: 'success', message: 'Item deleted successfully!' });
      loadItems();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      quantity: 0,
      unit: 'PIECE',
      lowStockThreshold: 10,
      vendorName: '',
      vendorEmail: '',
      vendorPhone: '',
    });
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      quantity: item.quantity,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold,
      vendorName: item.vendorName || '',
      vendorEmail: item.vendorEmail || '',
      vendorPhone: item.vendorPhone || '',
    });
    setShowModal(true);
  };

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustData({ adjustment: 0, reason: '' });
    setShowAdjustModal(true);
  };

  const isLowStock = (item: any) => item.quantity <= item.lowStockThreshold;

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600 mt-1">Manage your stock and resources</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedItem(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Item
          </Button>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Low Stock Alert */}
        {items.filter(isLowStock).length > 0 && (
          <Card>
            <div className="flex items-center space-x-3 text-orange-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <p className="font-medium">Low Stock Alert</p>
                <p className="text-sm text-gray-600">
                  {items.filter(isLowStock).length} items below threshold
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length > 0 ? (
            items.map((item) => (
              <Card key={item.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.sku && (
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                      )}
                    </div>
                    {isLowStock(item) && (
                      <TrendingDown className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {item.quantity}
                      </p>
                      <p className="text-xs text-gray-500">{item.unit}</p>
                    </div>
                    <Badge
                      variant={isLowStock(item) ? 'warning' : 'success'}
                    >
                      {isLowStock(item) ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Threshold: {item.lowStockThreshold} {item.unit}</p>
                    {item.vendorName && (
                      <p className="mt-1">Vendor: {item.vendorName}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openAdjustModal(item)}
                      className="flex-1"
                    >
                      Adjust
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No inventory items yet</p>
              <p className="text-sm mt-1">Add your first item to get started</p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
            resetForm();
          }}
          title={selectedItem ? 'Edit Item' : 'Create New Item'}
          size="lg"
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedItem(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {selectedItem ? 'Update' : 'Create'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NAME */}
            <Input
              label="Item Name"
              placeholder="e.g., Surgical Gloves"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Item description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* SHOW THESE ONLY WHEN CREATING */}
            {!selectedItem && (
              <>
                <Input
                  label="SKU"
                  placeholder="e.g., SKU-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Initial Quantity"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                    >
                      <option value="PIECE">Piece</option>
                      <option value="BOX">Box</option>
                      <option value="BOTTLE">Bottle</option>
                      <option value="PACK">Pack</option>
                      <option value="KG">Kilogram</option>
                      <option value="LITER">Liter</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* LOW STOCK THRESHOLD */}
            <Input
              type="number"
              label="Low Stock Threshold"
              placeholder="10"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lowStockThreshold: parseInt(e.target.value) || 0,
                })
              }
              required
            />

            {/* VENDOR INFO */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">
                Vendor Information
              </h4>

              <div className="space-y-4">
                <Input
                  label="Vendor Name"
                  placeholder="Vendor name"
                  value={formData.vendorName}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorName: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="email"
                    label="Vendor Email"
                    placeholder="vendor@example.com"
                    value={formData.vendorEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorEmail: e.target.value })
                    }
                  />
                  <Input
                    type="tel"
                    label="Vendor Phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.vendorPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorPhone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

          </form>

        </Modal>

        {/* Adjust Stock Modal */}
        <Modal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedItem(null);
            setAdjustData({ adjustment: 0, reason: '' });
          }}
          title={`Adjust Stock: ${selectedItem?.name}`}
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedItem(null);
                  setAdjustData({ adjustment: 0, reason: '' });
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAdjust}>
                Adjust Stock
              </Button>
            </div>
          }
        >
          <form onSubmit={handleAdjust} className="space-y-4">
            {selectedItem && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedItem.quantity} {selectedItem.unit}
                </p>
              </div>
            )}

            <Input
              type="number"
              label="Adjustment"
              placeholder="Use negative for reduction (e.g., -10)"
              helperText="Use negative numbers to reduce stock (e.g., -5 for removing 5 items)"
              value={adjustData.adjustment}
              onChange={(e) => setAdjustData({ ...adjustData, adjustment: parseInt(e.target.value) || 0 })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Reason for adjustment..."
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                required
              />
            </div>

            {selectedItem && adjustData.adjustment !== 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">New Stock</p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedItem.quantity + adjustData.adjustment} {selectedItem.unit}
                </p>
              </div>
            )}
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}