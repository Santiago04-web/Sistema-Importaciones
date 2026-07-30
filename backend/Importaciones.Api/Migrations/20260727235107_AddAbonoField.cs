using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Importaciones.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAbonoField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Abono",
                table: "Pedidos",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Abono",
                table: "Pedidos");
        }
    }
}
