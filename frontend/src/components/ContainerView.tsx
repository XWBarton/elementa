import { Tooltip } from 'antd'
import { Extraction } from '../types'

interface Props {
  containerType: string
  samples: Extraction[]
  highlightCode?: string | null
  onWellClick?: (sample: Extraction | null, position: string) => void
}

// Generate all positions for a given container type
function getPositions(containerType: string): string[] {
  if (containerType === '96-well plate') {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const cols = Array.from({ length: 12 }, (_, i) => String(i + 1))
    return rows.flatMap(r => cols.map(c => `${r}${c}`))
  }
  if (containerType === '384-well plate') {
    const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']
    const cols = Array.from({ length: 24 }, (_, i) => String(i + 1))
    return rows.flatMap(r => cols.map(c => `${r}${c}`))
  }
  // Tubes — show up to 96 numbered positions
  return Array.from({ length: 96 }, (_, i) => String(i + 1))
}

function getGridDimensions(containerType: string): { rows: string[]; cols: string[] } {
  if (containerType === '96-well plate') {
    return {
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      cols: Array.from({ length: 12 }, (_, i) => String(i + 1)),
    }
  }
  if (containerType === '384-well plate') {
    return {
      rows: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'],
      cols: Array.from({ length: 24 }, (_, i) => String(i + 1)),
    }
  }
  // Tubes: 12 columns × 8 rows
  return {
    rows: Array.from({ length: 8 }, (_, i) => String(i + 1)),
    cols: Array.from({ length: 12 }, (_, i) => String(i + 1)),
  }
}

export default function ContainerView({ containerType, samples, highlightCode, onWellClick }: Props) {
  const byPosition = new Map<string, Extraction>()
  samples.forEach(s => { if (s.position) byPosition.set(s.position, s) })

  const isPlate = containerType.includes('plate')
  const { rows, cols } = getGridDimensions(containerType)

  const wellSize = containerType === '384-well plate' ? 18 : containerType === '96-well plate' ? 32 : 36
  const fontSize = containerType === '384-well plate' ? 8 : 10

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
        {isPlate && (
          <thead>
            <tr>
              <th style={{ width: wellSize, minWidth: wellSize }} />
              {cols.map(c => (
                <th key={c} style={{ textAlign: 'center', fontSize, color: '#888', fontWeight: 400, width: wellSize, minWidth: wellSize }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map(row => (
            <tr key={row}>
              {isPlate && (
                <td style={{ textAlign: 'right', fontSize, color: '#888', paddingRight: 4, fontWeight: 400 }}>
                  {row}
                </td>
              )}
              {cols.map(col => {
                const pos = isPlate ? `${row}${col}` : String((Number(row) - 1) * cols.length + Number(col))
                const sample = byPosition.get(pos)
                const isHighlighted = sample?.specimen_code === highlightCode
                const isEmpty = !sample

                const typeColors: Record<string, [string, string]> = {
                  positive_control: ['#52c41a', '#389e0d'],
                  extraction_blank: ['#fa8c16', '#d46b08'],
                  ntc: ['#eb2f96', '#c41d7f'],
                }
                let bg = '#f0f0f0'
                let border = '1px solid #d9d9d9'
                if (!isEmpty) {
                  if (isHighlighted) {
                    bg = '#faad14'; border = '1px solid #d48806'
                  } else {
                    const tc = typeColors[sample!.sample_type ?? '']
                    bg = tc ? tc[0] : '#1677ff'
                    border = tc ? `1px solid ${tc[1]}` : '1px solid #0958d9'
                  }
                }

                const cell = (
                  <td key={col} style={{ padding: 0 }}>
                    <div
                      onClick={() => onWellClick?.(sample ?? null, pos)}
                      style={{
                        width: wellSize,
                        height: wellSize,
                        borderRadius: isPlate ? '50%' : 4,
                        background: bg,
                        border,
                        cursor: onWellClick ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize,
                        color: isEmpty ? '#bbb' : '#fff',
                        fontWeight: 600,
                        userSelect: 'none',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {!isPlate ? pos : ''}
                    </div>
                  </td>
                )

                if (!isEmpty) {
                  const typeLabel = sample!.sample_type && sample!.sample_type !== 'specimen'
                    ? ` [${sample!.sample_type.replace('_', ' ')}]`
                    : ''
                  return (
                    <Tooltip key={col} title={`${pos}: ${sample!.specimen_code}${typeLabel}`} mouseEnterDelay={0.1}>
                      {cell}
                    </Tooltip>
                  )
                }
                return cell
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#888' }}>
        {[
          { bg: '#f0f0f0', border: '#d9d9d9', label: 'Empty' },
          { bg: '#1677ff', border: '#0958d9', label: 'Specimen' },
          { bg: '#52c41a', border: '#389e0d', label: 'Positive Control' },
          { bg: '#fa8c16', border: '#d46b08', label: 'Extraction Blank' },
          { bg: '#eb2f96', border: '#c41d7f', label: 'NTC' },
        ].map(({ bg, border, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: isPlate ? '50%' : 2, background: bg, border: `1px solid ${border}` }} />
            {label}
          </span>
        ))}
        {highlightCode && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: isPlate ? '50%' : 2, background: '#faad14', border: '1px solid #d48806' }} />
            {highlightCode} (Tessera)
          </span>
        )}
      </div>
    </div>
  )
}

/** Returns the next unoccupied position for a given container type */
export function nextPosition(containerType: string, samples: Extraction[]): string {
  const occupied = new Set(samples.map(s => s.position).filter(Boolean))
  const all = getPositions(containerType)
  return all.find(p => !occupied.has(p)) ?? ''
}
