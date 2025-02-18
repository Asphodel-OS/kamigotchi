package db

import (
	"database/sql"
	"fmt"
	"math/big"
	"reflect"
)

// BigIntScanner is a custom scanner for big.Int values
type BigIntScanner struct {
	value **big.Int
}

func (s *BigIntScanner) Scan(src interface{}) error {
	if src == nil {
		*s.value = nil
		return nil
	}

	switch v := src.(type) {
	case []byte:
		n := new(big.Int)
		n, ok := n.SetString(string(v), 10)
		if !ok {
			return fmt.Errorf("failed to parse big.Int from %s", string(v))
		}
		*s.value = n
		return nil
	case string:
		n := new(big.Int)
		n, ok := n.SetString(v, 10)
		if !ok {
			return fmt.Errorf("failed to parse big.Int from %s", v)
		}
		*s.value = n
		return nil
	default:
		return fmt.Errorf("unsupported type for BigInt: %T", src)
	}
}

func scanRow(rows *sql.Rows, dest interface{}) error {
	v := reflect.ValueOf(dest).Elem()
	fields := make([]interface{}, v.NumField())

	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		
		// Special handling for *big.Int
		if field.Type() == reflect.TypeOf((*big.Int)(nil)) {
			scanner := &BigIntScanner{value: field.Addr().Interface().(**big.Int)}
			fields[i] = scanner
		} else {
			fields[i] = field.Addr().Interface()
		}
	}

	return rows.Scan(fields...)
} 