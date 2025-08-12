import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { purchaseOrderService } from '@/lib/purchaseOrderService';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

function useCatalog(apiFn, nameKeyCandidates) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    if (!q) return list;
    return list.filter((it) =>
      String(nameKeyCandidates.map(k => it[k]).find(Boolean) || it.name || it.id)
        .toLowerCase()
        .includes(q)
    );
  }, [items, search, nameKeyCandidates]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFn();
      setItems(res.success && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { items, filtered, loading, error, search, setSearch, reload: load };
}

function CatalogTab({ title, apiFn, nameKeyCandidates, idKeyCandidates, resourcePath }) {
  const { filtered, loading, error, search, setSearch, reload } = useCatalog(apiFn, nameKeyCandidates);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const resolveName = (row) => nameKeyCandidates.map(k => row[k]).find(Boolean) || row.name || '';
  const resolveId = (row) => idKeyCandidates.map(k => row[k]).find(Boolean) || row.id;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const payload = { [nameKeyCandidates[0]]: newName };
    const res = await purchaseOrderService.createCatalogItem(resourcePath, payload);
    setSaving(false);
    if (res.success) {
      setNewName('');
      reload();
    }
  };

  const handleRename = async (row) => {
    const id = resolveId(row);
    const current = resolveName(row);
    const next = window.prompt(`Rename ${title}`, current);
    if (next == null || next.trim() === '' || next === current) return;
    const payload = { [nameKeyCandidates[0]]: next };
    const res = await purchaseOrderService.updateCatalogItem(resourcePath, id, payload);
    if (res.success) reload();
  };

  const handleDelete = async (row) => {
    const id = resolveId(row);
    if (!window.confirm('Delete this record?')) return;
    const res = await purchaseOrderService.deleteCatalogItem(resourcePath, id);
    if (res.success) reload();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e)=>setSearch(e.target.value)} className="h-8 w-52" />
          <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Inline create bar */}
        <div className="flex items-center gap-2 mb-3">
          <Input placeholder={`Add new ${title.toLowerCase()}...`} value={newName} onChange={(e)=>setNewName(e.target.value)} className="h-8 w-64" />
          <Button size="sm" onClick={handleCreate} disabled={saving || !newName.trim()}>Add</Button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => {
                  const id = resolveId(it);
                  const name = resolveName(it) || `#${id}`;
                  return (
                    <TableRow key={id}>
                      <TableCell>{id}</TableCell>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRename(it)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(it)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-gray-500 text-center">No records</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Catalogs() {
  return (
    <div className="flex-1 p-4">
      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="types">Order Types</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <TabsContent value="models">
            <CatalogTab title="Models" apiFn={() => purchaseOrderService.getAllModels()} resourcePath={'/po_model'} nameKeyCandidates={["model", "model_name", "name"]} idKeyCandidates={["id","model_id"]} />
          </TabsContent>
          <TabsContent value="brands">
            <CatalogTab title="Brands" apiFn={() => purchaseOrderService.getAllBrands()} resourcePath={'/po_brand'} nameKeyCandidates={["brand", "brand_name", "name"]} idKeyCandidates={["id","brand_id"]} />
          </TabsContent>
          <TabsContent value="types">
            <CatalogTab title="Order Types" apiFn={() => purchaseOrderService.getAllTypes()} resourcePath={'/po_type'} nameKeyCandidates={["typeColor", "type_name", "name"]} idKeyCandidates={["id","type_id"]} />
          </TabsContent>
          <TabsContent value="items">
            <CatalogTab title="Items" apiFn={() => purchaseOrderService.getAllItemNames()} resourcePath={'/po_itemNames'} nameKeyCandidates={["itemName", "item_name", "name"]} idKeyCandidates={["id","item_id"]} />
          </TabsContent>
          <TabsContent value="categories">
            <CatalogTab title="Categories" apiFn={() => purchaseOrderService.getAllCategories()} resourcePath={'/po_category'} nameKeyCandidates={["category", "category_name", "name"]} idKeyCandidates={["id","category_id"]} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

