using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Importaciones.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEtapaHistorialAndFechaLimite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaLimitePago",
                table: "Pedidos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EtapaHistoriales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    Etapa = table.Column<int>(type: "int", nullable: false),
                    FechaCambio = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EtapaHistoriales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EtapaHistoriales_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EtapaHistoriales_PedidoId",
                table: "EtapaHistoriales",
                column: "PedidoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EtapaHistoriales");

            migrationBuilder.DropColumn(
                name: "FechaLimitePago",
                table: "Pedidos");
        }
    }
}
