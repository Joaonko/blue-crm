import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function OrganizationSettingsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A5C]">Organização</h1>
        <p className="text-muted-foreground">Configurações da sua organização</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações da Organização</CardTitle>
          <CardDescription>Dados gerais da sua empresa no CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_name">Nome da Organização</Label>
            <Input id="org_name" placeholder="Minha Empresa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_slug">Slug (identificador único)</Label>
            <Input id="org_slug" placeholder="minha-empresa" />
          </div>
          <Button className="bg-blue hover:bg-blue/90">Salvar Alterações</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="max-w-2xl border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis para sua organização</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Excluir Organização</Button>
        </CardContent>
      </Card>
    </div>
  )
}
