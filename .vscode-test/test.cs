using Godot;
using Godot.Collections;

using Game.Assets.Weapons.Types;
using Game.Core;
using Game.Debug;
using Game.Entities.Hostiles;

namespace Game.Assets.Projectiles {

	public partial class BaseProjectile : RigidBody3D {

		public  float DespawnTimer = 20.0f;
		public  float Damage       = 10.0f;
		private double  _elapsedTime = 0.0;
		private Vector3 _movement;


		public  bool  FromPlayer   = false;

		public override void _Ready() {
			BodyEntered += OnBodyEntered; //DISABLES RICOCHETS
		}

		#if DEBUG
			private static readonly bool _debugMode = (bool)ProjectSettings.GetSetting("game/debug_mode");
		#endif

		public static Vector3 GetAimTarget(RayCast3D rayCast) {
			if (rayCast.IsColliding()) {
				return rayCast.GetCollisionPoint();
			}

			return rayCast.ToGlobal(rayCast.TargetPosition);
		}

		public override void _IntegrateForces(PhysicsDirectBodyState3D state) {
			float   dt           = state.Step;
			Vector3 displacement = state.LinearVelocity * dt;
			Vector3 origin       = state.Transform.Origin;

			PhysicsRayQueryParameters3D query = PhysicsRayQueryParameters3D.Create(
				origin,
				origin + displacement
			);

			query.CollisionMask = CollisionMask;
			query.Exclude       = [GetRid()];

			Dictionary result = GetWorld3D().DirectSpaceState.IntersectRay(query);

			if (result.Count > 0) {
				#if DEBUG
					if ((GodotObject)result["collider"] is HostileBody) {
						Log.Print($"Hit Enemy: { result["collider"] }");
						((GodotObject)result["collider"] as HostileBody).Panic();
					} else {
						Log.Print($"Hit... Something: { ((Node)(GodotObject)result["collider"]).Name }");
					}
				#endif

				QueueFree();
				Freeze = true;
				Visible = false;
				return;
			}
		}

		public override void _Process(double delta) {
			_elapsedTime += delta;

			#if DEBUG
				if (_debugMode) {
					MeshInstance3D meshInstance    = GetNode<MeshInstance3D>("MeshInstance3D");
					MeshInstance3D newMeshInstance = new();
					Mesh           mesh            = meshInstance.Mesh;

					newMeshInstance.Mesh             = mesh;
					newMeshInstance.MaterialOverride = new StandardMaterial3D() {
						AlbedoColor  = new Color(1.0f, 0.0f, 0.0f, 0.5f),
						Transparency = BaseMaterial3D.TransparencyEnum.Alpha
					};

					GetParent().AddChild(newMeshInstance);

					newMeshInstance.GlobalTransform = meshInstance.GlobalTransform;
				}
			#endif

			if (_elapsedTime > DespawnTimer) {
				Log.Print($"Despawning { Name } due to timer.");
				QueueFree();
			}
		}

		private void OnBodyEntered(Node body) {
			if (Freeze) { return; }

			if (body is HostileBody hostile && FromPlayer) {
				hostile.CalculateHit(this);
				Freeze = true;

				QueueFree();
			}

			#if DEBUG
				Log.Print($"Physical contact fallback triggered against: { body.Name }");
			#endif
		}

		public static void FireProjectile(BaseProjectile projectile, BaseWeapon weapon, RayCast3D rayCast = null) {
			bool isMatch = weapon.Stats.Type switch {
				Enums.WEAPONTYPE.SHOTGUN => projectile is ShotgunProjectile,
				Enums.WEAPONTYPE.SMG     => projectile is SMGProjectile,
				Enums.WEAPONTYPE.GRENADE => projectile is GrenadeProjectile,
				Enums.WEAPONTYPE.ENERGY  => projectile is EnergyProjectile,
				_ => false
			};

			if (!isMatch) {
				Log.Print($"Projectile type {projectile.GetType().Name} does not match weapon type {weapon.Stats.Type}");
				return;
			}

			rayCast ??= GameManager.GetPlayer().RayCast;

			switch (projectile) {
				case SMGProjectile smg:
					smg.Name = $"SMGProjectile_{Time.GetTicksUsec()}";
					smg.FireSMGProjectile(weapon, GetAimTarget(rayCast));
					break;
				case ShotgunProjectile shotgun:
					shotgun.Name = $"ShotgunProjectile_{Time.GetTicksUsec()}";
					shotgun.FireShotgunProjectile(weapon, GetAimTarget(rayCast));
					break;
				case GrenadeProjectile grenade:
					grenade.Name = $"GrenadeProjectile_{Time.GetTicksUsec()}";
					grenade.FireGrenadeProjectile(weapon, GetAimTarget(rayCast));
					break;
				case EnergyProjectile energy:
					energy.Name = $"EnergyProjectile_{Time.GetTicksUsec()}";
					energy.FireEnergyProjectile(weapon, GetAimTarget(rayCast));
					break;
			}
		}

	}

}