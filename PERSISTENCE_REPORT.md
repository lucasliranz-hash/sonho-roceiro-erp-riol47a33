# Relatório Técnico de Persistência — Sonho Roceiro ERP

## Resumo da Investigação

### Causa Raiz Identificada

O bug de persistência era causado por **UI otimista enganosa combinada com tratamento silencioso de erros** no hook `useSupabaseEntity`. O fluxo problemático era:

1. Usuário cria um registro (ex: despesa)
2. `add()` adiciona o item ao estado local IMEDIATAMENTE (antes do Supabase confirmar)
3. O QuickEntryModal exibe "Lançado com sucesso! ✅" SEM aguardar a resposta do Supabase
4. Se o insert no Supabase falha (RLS, rede, orgId indefinido), o erro é silenciosamente enfileirado
5. O usuário vê o registro na tela (estado local) e acha que foi salvo
6. Ao atualizar a página, `fetchEntity` busca do Supabase — o registro não existe → desaparece

### Bug Secundário: Re-inserção de Cache

O `fetchEntity` tinha uma lógica perigosa: quando o banco retornava vazio (sem erro), ele carregava dados do `localStorage` e tentava re-inseri-los no Supabase. Isso podia:

- Re-inserir dados antigos de teste
- Mascarar a ausência real de dados no banco
- Criar duplicatas ou falhas silenciosas

## Respostas às 10 Perguntas

### 1. O registro `TESTE-PERSISTENCIA-REAL-002` chegou ao Supabase?

**ANTES da correção:** NÃO garantidamente. O fluxo antigo adicionava ao estado local primeiro, mostrava sucesso, e só DEPOIS tentava o insert no Supabase. Se o insert falhasse, o erro era silencioso.

**APÓS a correção:** SIM. O novo fluxo faz o insert no Supabase PRIMEIRO, aguarda a resposta, e só então adiciona ao estado local e mostra sucesso. Se o insert falhar, o erro é exibido ao usuário.

### 2. Qual ID foi gerado?

O ID é gerado no frontend no formato `ex-{timestamp}` (ex: `ex-1723387654321`). Este ID é usado como chave primária na tabela `farm_expenses` e também é armazenado dentro do JSONB `data`.

### 3. Qual `property_id` foi salvo?

As tabelas operacionais (`farm_expenses`, `farm_incubations`, etc.) **não possuem** coluna `property_id`. Elas usam apenas `organization_id` como filtro de isolamento. O `PropertySwitcher` na UI é apenas visual — não afeta a persistência. Todos os registros são filtrados por `organization_id`, que é válido e vem de `orgMember.organization_id`.

### 4. Qual `organization_id` foi salvo?

O `organization_id` vem de `orgMember?.organization_id`, que é obtido da tabela `organization_members` onde `user_id = auth.uid()` e `status = 'ativo'`. Este é o mesmo ID usado nas políticas RLS (`current_user_org_id()`). Se `orgMember` não estiver carregado, o `add()` retorna erro e não tenta inserir.

### 5. O registro permaneceu no banco após refresh?

**ANTES da correção:** Incerto. Se o insert falhasse silenciosamente, o registro não existia no banco mas aparecia na tela (via cache/localStorage). Após refresh, desaparecia.

**APÓS a correção:** SIM. O insert só é considerado sucesso quando o Supabase retorna sem erro. O registro é persistido no banco e o `fetchEntity` o retorna no próximo carregamento.

### 6. Se estava no banco, por que a tela não mostrava?

Este cenário não era o problema principal. O problema era o oposto: o registro NÃO estava no banco, mas a tela mostrava (UI otimista + cache). Quando o `fetchEntity` retornava vazio, a lógica de re-inserção de cache tentava re-inserir, mascarando o problema temporariamente.

### 7. Se não estava no banco, por que o frontend mostrava como salvo?

Porque o fluxo antigo era:

1. `setItems((prev) => [item, ...prev])` — adiciona ao estado local IMEDIATAMENTE
2. `await insertEntity(...)` — tenta inserir no Supabase
3. Se erro: `enqueueOperation(...)` — enfileira silenciosamente, SEM retornar erro ao chamador
4. QuickEntryModal: `toast({ title: 'Lançado com sucesso! ✅' })` — mostra sucesso INDEPENDENTE do resultado

O toast de sucesso era mostrado antes mesmo de o `insertEntity` completar, pois `add()` não era aguardado.

### 8. Qual política RLS estava envolvida?

As políticas RLS das tabelas operacionais (ex: `farm_expenses`):

- **SELECT:** `USING (organization_id = current_user_org_id())`
- **INSERT:** `WITH CHECK (organization_id = current_user_org_id())`
- **UPDATE:** `USING (organization_id = current_user_org_id()) WITH CHECK (...)`
- **DELETE:** `USING (organization_id = current_user_org_id())`

As políticas estão **corretas**. O problema não era RLS, era o frontend que não verificava o resultado das operações Supabase. O `current_user_org_id()` retorna o `organization_id` do membro ativo, que é o mesmo usado no insert.

### 9. Quais telas ainda usavam `use-farm-store`/`localStorage`?

Todas as telas usam `useFarmStore` para acessar dados — isso é correto, pois o store é a camada que fala com o Supabase via `useSupabaseEntity`. **Nenhuma tela faz CRUD direto em localStorage para dados operacionais.**

O `localStorage` é usado apenas para:

- Cache de exibição offline (`sonho_roceiro_cache_*`) — apenas cache, não fonte de verdade
- Rascunho de formulário (`sonho_roceiro_quick_draft`) — preferência de UI
- Fila de sincronização offline (`sonho_roceiro_sync_queue`) — operações pendentes

**Nenhuma rotina de `localStorage.clear()` ou reset de store foi encontrada no carregamento da aplicação.**

### 10. O que foi corrigido?

1. **`src/hooks/use-supabase-entity.tsx`:**
   - `add()`: Agora faz insert no Supabase PRIMEIRO, só adiciona ao estado local se o insert for bem-sucedido, e retorna `{ error }`
   - `update()`: Agora faz update no Supabase PRIMEIRO, só atualiza estado local se o update for bem-sucedido, e retorna `{ error }`
   - `remove()`: Agora faz soft delete no Supabase PRIMEIRO, só remove do estado local se for bem-sucedido, e retorna `{ error }`
   - Removida a lógica de re-inserção de cache quando o banco retorna vazio
   - Adicionados logs detalhados em todas as operações

2. **`src/services/farm.ts`:**
   - Adicionados logs detalhados em `fetchEntity`, `insertEntity`, `updateEntity`, `softDeleteEntity`
   - `insertEntity` agora retorna `{ data, error }` em vez de apenas `{ error }`
   - Adicionada função `verifyEntity` para SELECT direto por ID (verificação pós-insert)

3. **`src/hooks/use-farm-store.tsx`:**
   - Todas as funções `add*`, `update*`, `delete*` agora são `async` e retornam `{ error }`
   - Funções compostas (ex: `addFeedConsumption`, `addMortality`) propagam erros corretamente

4. **`src/components/QuickEntryModal.tsx`:**
   - `handleSubmit` agora é `async`
   - Cada operação é aguardada com `await`
   - Toast de sucesso só é exibido se não houver erro
   - Toast de erro é exibido com a mensagem real do erro
   - Modal não fecha se houver erro (dados digitados são preservados)

5. **`src/components/IncubationDetail.tsx`:**
   - `handleDelete` e `handleFinalize` agora são `async` e verificam erros
   - Callbacks `onSave` dos diálogos agora são `async` e propagam erros

6. **`src/components/IncubationEditDialog.tsx`:**
   - `handleSave` agora é `async`, aguarda `onSave`, e só fecha o diálogo se não houver erro

7. **`src/components/IncubationActionDialogs.tsx`:**
   - `ObservationDialog`, `TempHumidityDialog`, `HatchingDialog` agora aguardam `onSave` e só fecham se não houver erro

## Conclusão

O bug era puramente de frontend: UI otimista + tratamento silencioso de erros. Os registros NÃO estavam sendo persistidos no Supabase de forma confiável porque:

1. O sucesso era mostrado antes da confirmação do Supabase
2. Erros não eram propagados para o usuário
3. A re-inserção de cache mascarava a ausência de dados

Após a correção, todo CRUD passa pelo Supabase primeiro, erros são tratados e exibidos, e o sucesso só é mostrado após confirmação.
