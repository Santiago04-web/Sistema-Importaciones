using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Importaciones.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProveedorDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Calificacion",
                table: "Proveedores",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Categoria",
                table: "Proveedores",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WeChatId",
                table: "Proveedores",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Calificacion",
                table: "Proveedores");

            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "Proveedores");

            migrationBuilder.DropColumn(
                name: "WeChatId",
                table: "Proveedores");
        }
    }
}
