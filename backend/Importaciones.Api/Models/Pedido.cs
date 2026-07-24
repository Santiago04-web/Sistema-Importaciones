namespace Importaciones.Api.Models;

public class Pedido
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Ciudad { get; set; } = "";
    public DateTime FechaNegociacion { get; set; }
    public string Descripcion { get; set; } = "";
    public string Observaciones { get; set; } = "";
    public string Referencia { get; set; } = "";
    public int TotalQty { get; set; }
    public decimal Yuanes { get; set; }
    public int PiezasCaja { get; set; }
    public decimal Cubica { get; set; }
    public decimal Tasa { get; set; }
    public decimal PrecioMt3 { get; set; }
    public decimal PorcentajeEhuk { get; set; }
    public decimal Pesos => Yuanes * Tasa;
    public int Cajas => PiezasCaja > 0 ? TotalQty / PiezasCaja : 0;
    public decimal Mt3 => Cubica * Cajas;
    public decimal Flete => Mt3 * PrecioMt3;
    public decimal Producto => TotalQty * Pesos;
    public decimal ProductoEnYuanes => Yuanes * TotalQty;
    public decimal ComisionTrabajo => Producto * 0.05m;
    public decimal PagoInicial => Producto * 0.30m;
    public decimal ComisionApalancamiento=> (Producto - PagoInicial) * 0.07m;
    public decimal Total => Flete + Producto + ComisionTrabajo + ComisionApalancamiento;
    public decimal Saldo => Total - PagoInicial; 
    public decimal CostoFinal => TotalQty  > 0 ? Total / TotalQty : 0;
    public decimal CostoVenta => CostoFinal * (1 + PorcentajeEhuk);
    public decimal FinalVenta => CostoVenta * TotalQty;
    public decimal Ganancia => (CostoVenta - CostoFinal) * TotalQty;

}
