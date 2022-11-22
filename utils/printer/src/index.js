import Table from 'cli-table3'

// Change the prefix.
const LogLevel = {
  Normal: 'Normal',
  Debug: 'Debug',
}

class Printer {
  setLevel (level = LogLevel.Normal) {
    this.level = level
  }


  transformParam (params) {
    return params.map((param) => typeof(param) === 'object' && param !== null ? JSON.stringify(param, null, 2) : param)
  }

  success (...args) {
    console.log('SUC', ...this.transformParam(args))
  }

  error (...args) {
    console.log('ERR', ...this.transformParam(args))
  }

  info (...args) {
    console.log('INF', ...this.transformParam(args))
  }

  table (head, rows) {
    const table = new Table({
      head,
    })
    if (Array.isArray(rows[0])) {
      table.push(...rows)
    } else {
      table.push(rows)
    }
    console.log(table.toString())
  }


  custom (prefix, ...args) {
    console.log(prefix, ...this.transformParam(args))
  }

  verbose (...args) {
    if (this.level !== LogLevel.Debug) return
    console.log('DEB', ...this.transformParam(args))
  }
}

export const printer = new Printer()
