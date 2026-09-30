import { describe, it, expect } from 'vitest'
import { computeLotAnimalMovement, computeLotLiveQuantity } from '@/lib/calculations'
import { Lot, Mortality, Slaughtering, Sale } from '@/types/farm'

describe('Regra definitiva de Quantidade Viva e Movimentação de Animais', () => {
  const baseLot: Lot = {
    id: 'l-test-1',
    code: 'L-0003',
    name: 'Caipira pescoço pelado',
    type: 'Poedeiras',
    startDate: '2025-01-01',
    origin: 'Interna',
    supplier: 'Próprio',
    breed: 'Pescoço Pelado',
    initialQuantity: 11,
    currentQuantity: 11,
    initialAgeDays: 1,
    acquisitionCost: 0,
    purpose: 'Postura',
    status: 'Ativo',
  }

  it('Lote 11 aves sem eventos = 11/11 vivas e zeros nos eventos', () => {
    const movement = computeLotAnimalMovement(baseLot, [], [], [])
    expect(movement.initialQuantity).toBe(11)
    expect(movement.entries).toBe(0)
    expect(movement.mortality).toBe(0)
    expect(movement.slaughter).toBe(0)
    expect(movement.otherExits).toBe(0)
    expect(movement.liveQuantity).toBe(11)
    expect(computeLotLiveQuantity(baseLot, [], [], [])).toBe(11)
  })

  it('2 mortalidades = 9/11 vivas', () => {
    const mortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
      },
    ]

    const movement = computeLotAnimalMovement(baseLot, mortalities, [], [])
    expect(movement.mortality).toBe(2)
    expect(movement.liveQuantity).toBe(9)
    expect(computeLotLiveQuantity(baseLot, mortalities, [], [])).toBe(9)
  })

  it('2 mortalidades + abate 3 = 6/11 vivas', () => {
    const mortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
      },
    ]
    const slaughters: Slaughtering[] = [
      {
        id: 's-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        species: 'Galinha',
        date: '2025-01-15',
        quantityAnimals: 3,
        destination: 'Venda',
        totalCost: 30,
      },
    ]

    const movement = computeLotAnimalMovement(baseLot, mortalities, slaughters, [])
    expect(movement.mortality).toBe(2)
    expect(movement.slaughter).toBe(3)
    expect(movement.liveQuantity).toBe(6)
    expect(computeLotLiveQuantity(baseLot, mortalities, slaughters, [])).toBe(6)
  })

  it('Excluir abate => volta a 9/11 vivas (devolução na exclusão)', () => {
    const mortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
      },
    ]
    // Abate excluído (soft-delete ou removido da lista)
    const slaughters: Slaughtering[] = []

    const movement = computeLotAnimalMovement(baseLot, mortalities, slaughters, [])
    expect(movement.mortality).toBe(2)
    expect(movement.slaughter).toBe(0)
    expect(movement.liveQuantity).toBe(9)
    expect(computeLotLiveQuantity(baseLot, mortalities, slaughters, [])).toBe(9)
  })

  it('Excluir mortalidades => 11/11 vivas', () => {
    const movement = computeLotAnimalMovement(baseLot, [], [], [])
    expect(movement.mortality).toBe(0)
    expect(movement.slaughter).toBe(0)
    expect(movement.liveQuantity).toBe(11)
  })

  it('Editar mortalidade 2 -> 1 => 10/11 vivas', () => {
    const editedMortalities: Mortality[] = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 1,
        cause: 'Causa natural (ajustado)',
      },
    ]
    const movement = computeLotAnimalMovement(baseLot, editedMortalities, [], [])
    expect(movement.mortality).toBe(1)
    expect(movement.liveQuantity).toBe(10)
  })

  it('Editar initialQuantity do lote 5 -> 11 sem saídas => viva acompanha para 11', () => {
    const updatedLot: Lot = {
      ...baseLot,
      initialQuantity: 11,
    }
    const movement = computeLotAnimalMovement(updatedLot, [], [], [])
    expect(movement.initialQuantity).toBe(11)
    expect(movement.liveQuantity).toBe(11)
  })

  it('Respeita soft-delete de eventos com deleted_at', () => {
    const mortalitiesWithDeleted = [
      {
        id: 'm-1',
        lotId: 'l-test-1',
        lotName: 'Caipira pescoço pelado',
        date: '2025-01-10',
        quantity: 2,
        cause: 'Causa natural',
        deleted_at: '2025-01-11T10:00:00Z',
      },
    ] as any
    const movement = computeLotAnimalMovement(baseLot, mortalitiesWithDeleted, [], [])
    expect(movement.mortality).toBe(0)
    expect(movement.liveQuantity).toBe(11)
  })
})
